import { filter, groupBy, isFunction, map, sortBy } from "lodash";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { AppEvents } from "./app-events";
import { createTaskEditorPanel, disposeTaskSelectionPanel } from "./panels/panels-handler";
import { getSWA } from "./utils/swa";
import { getLogger } from "./logger/logger-wrapper";
import { messages } from "./i18n/messages";
import { serializeTask } from "./utils/task-serializer";
import { getConfiguredTasksFromCache } from "./services/tasks-provider";

const escapeStringRegexp = require("escape-string-regexp");

interface FrontendTasks {
  intent: string;
  tasksByIntent: ConfiguredTask[];
}

export class TasksSelection {
  constructor(
    private readonly rpc: IRpc,
    private readonly appEvents: AppEvents,
    private readonly tasks: ConfiguredTask[],
    private readonly readResource: (file: string) => Promise<string>
  ) {
    this.rpc.setResponseTimeout(2000);
    this.rpc.registerMethod({
      func: this.onFrontendReady,
      name: "onFrontendReady",
      thisArg: this,
    });
    this.rpc.registerMethod({
      func: this.setSelectedTask,
      name: "setSelectedTask",
      thisArg: this,
    });
  }

  private getTaskImage(type: string): string {
    const contributor = this.appEvents.getTasksEditorContributor(type);
    return contributor ? contributor.getTaskImage() : "";
  }

  private async onFrontendReady(): Promise<void> {
    // consider only tasks that are contributed to Tasks Explorer
    const contributedTasks = filter(
      this.tasks,
      (_) => _.taskType !== undefined && this.appEvents.getTasksEditorContributor(_.type) !== undefined
    );

    const contributedTasksWithImages: ConfiguredTask[] = map(contributedTasks, (_) => {
      return {
        ..._,
        __image: this.getTaskImage(_.type),
        label: _.label.replace("Template: ", ""),
      };
    });

    // group tasks by intents
    const tasksGroupedByIntent = groupBy(contributedTasksWithImages, (_) => _.taskType);

    // prepare tasks for frontend: array of { intent, tasksByIntent }
    const tasksFrontend: FrontendTasks[] = sortBy(
      map(tasksGroupedByIntent, function (value, key) {
        return { intent: key, tasksByIntent: value };
      }),
      "intent"
    );

    const message = tasksFrontend.length === 0 ? messages.MISSING_AUTO_DETECTED_TASKS() : "";

    return this.rpc.invoke("setTasks", [tasksFrontend, message]);
  }

  private async setSelectedTask(selectedTask: ConfiguredTask): Promise<void> {
    getSWA().track(messages.SWA_CREATE_TASK_EVENT(), [
      messages.SWA_TASK_EXPLORER_PARAM(),
      selectedTask.__intent,
      selectedTask.__extensionName,
    ]);
    const tasks = getConfiguredTasksFromCache();
    const existingLabels = map(tasks, (_) => _.label);
    selectedTask.label = this.getUniqueTaskLabel(selectedTask.label, existingLabels);
    await disposeTaskSelectionPanel();
    const newTask = { ...selectedTask };
    delete selectedTask.__wsFolder;
    delete selectedTask.__image;
    delete selectedTask.__intent;
    delete selectedTask.__extensionName;

    // hack: allow task definitions to be configured before they are serialized
    const contributor = this.appEvents.getTasksEditorContributor(selectedTask.type);
    if (isFunction(contributor?.onSave)) {
      await contributor?.onSave(selectedTask);
    }

    const index = await this.appEvents.addTaskToConfiguration(newTask.__wsFolder, selectedTask);
    getLogger().debug(messages.CREATE_TASK(serializeTask(selectedTask)));

    newTask.__index = index;
    return createTaskEditorPanel(newTask, this.readResource);
  }

  private getUniqueTaskLabel(label: string, existingLabels: string[]): string {
    // tasks created from auto detected tasks templates multiple times
    // will receive name: "<task_name> (<index>)"
    // where index is the next free number, starting from 2
    const fixedTaskLabel = escapeStringRegexp(label);
    const taskRegex = new RegExp(`^${fixedTaskLabel}( [(](\\d)*[)])$`);
    let index = 0;
    const similarTasks = filter(existingLabels, (_) => taskRegex.test(_));
    if (similarTasks.length > 0) {
      const similarTasksIndexes: number[] = map(similarTasks, (_) => {
        const matchArr = taskRegex.exec(_);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: verify
        return Number(matchArr![1].replace("(", "").replace(")", ""));
      });
      index = Math.max(...similarTasksIndexes) + 1;
    } else if (existingLabels.find((_) => _ === label)) {
      // identical match
      index = 2;
    }
    const taskSuffix = index === 0 ? "" : ` (${index})`;
    return label + taskSuffix;
  }
}
