import { filter, isFunction, map } from "lodash";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { AppEvents } from "./app-events";
import { getSWA } from "./utils/swa";
import { getLogger } from "./logger/logger-wrapper";
import { messages } from "./i18n/messages";
import { serializeTask } from "./utils/task-serializer";
import { getConfiguredTasksFromCache } from "./services/tasks-provider";
import { commands, window } from "vscode";
import { createTaskEditorPanel } from "./panels/panels-handler";
import { multiStepTaskSelect } from "./multi-step-select";
import { TYPE_FE_DEPLOY_CFG, fioriE2eConfig } from "./misc/fiori-e2e-config";
import { ElementTreeItem } from "./view/task-tree-item";

const escapeStringRegexp = require("escape-string-regexp");

export class TasksSelection {
  constructor(
    private readonly appEvents: AppEvents,
    private readonly tasks: ConfiguredTask[],
    private readonly readResource: (file: string) => Promise<string>
  ) {}

  public async select(treeItem?: ElementTreeItem): Promise<any> {
    try {
      const { task } = await multiStepTaskSelect(this.tasks, treeItem);
      if (task) {
        return await (task.type === TYPE_FE_DEPLOY_CFG.fioriDeploymentConfig
          ? fioriE2eConfig(task.wsFolder, task.project)
          : this.setSelectedTask(task));
      }
    } catch (e: any) {
      getLogger().debug(`Task selection failed: ${e.toString()}`);
      window.showErrorMessage(e.toString());
    }
  }
  private async setSelectedTask(selectedTask: ConfiguredTask): Promise<void> {
    getSWA().track(messages.SWA_CREATE_TASK_EVENT(), [
      messages.SWA_TASK_EXPLORER_PARAM(),
      selectedTask.__intent,
      selectedTask.__extensionName,
    ]);
    const tasks = getConfiguredTasksFromCache();
    selectedTask.label = this.getUniqueTaskLabel(selectedTask.label, map(tasks, "label"));

    const newTask = { ...selectedTask };
    delete selectedTask.__wsFolder;
    delete selectedTask.__image;
    delete selectedTask.__intent;
    delete selectedTask.__extensionName;

    // hack: allow task definitions to be configured before they are serialized
    const contributor = this.appEvents.getTasksEditorContributor(selectedTask.type);
    if (isFunction(contributor?.onSave)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- confirmed by previous line
      await contributor!.onSave(selectedTask);
    }

    const index = await this.appEvents.addTaskToConfiguration(newTask.__wsFolder, selectedTask);
    getLogger().debug(messages.CREATE_TASK(serializeTask(selectedTask)));

    newTask.__index = index;
    return createTaskEditorPanel(newTask, this.readResource).then(() => {
      void commands.executeCommand("tasks-explorer.tree.select", selectedTask);
    });
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
