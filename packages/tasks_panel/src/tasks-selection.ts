import { each, extend, filter, find, isEmpty, isEqual, isFunction, map, size, sortBy, uniq } from "lodash";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { AppEvents } from "./app-events";
import { getSWA } from "./utils/swa";
import { getLogger } from "./logger/logger-wrapper";
import { messages } from "./i18n/messages";
import { serializeTask } from "./utils/task-serializer";
import { getConfiguredTasksFromCache } from "./services/tasks-provider";
import { QuickPickItem, QuickPickOptions, window, QuickPickItemKind } from "vscode";
import { MISC, isMatchBuild, isMatchDeploy } from "./utils/ws-folder";
import { createTaskEditorPanel } from "./panels/panels-handler";

const escapeStringRegexp = require("escape-string-regexp");
const task_selection_canceled = "_canceled_";

export class TasksSelection {
  constructor(
    private readonly appEvents: AppEvents,
    private readonly tasks: ConfiguredTask[],
    private readonly readResource: (file: string) => Promise<string>
  ) {}

  private async showQuickPick<T extends QuickPickItem>(
    items: T[] | Thenable<T[]>,
    options?: QuickPickOptions
  ): Promise<any> {
    if (isEmpty(items)) {
      throw new Error(messages.MISSING_AUTO_DETECTED_TASKS());
    }
    const choice = await window.showQuickPick(
      items,
      extend(
        {
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        },
        options
      )
    );
    if (!choice) {
      throw new Error(task_selection_canceled);
    }
    return choice;
  }

  public async select(project?: string): Promise<any> {
    let selected;
    try {
      // step 1: (optional) select a project -> compose projects list
      let pickItems = uniq(map(this.tasks, "__wsFolder"));
      pickItems = project
        ? [
            find(pickItems, (item) => {
              return item === project;
            }),
          ]
        : pickItems;
      selected =
        size(pickItems) > 1
          ? await this.showQuickPick(pickItems, { placeHolder: "select a project root:" })
          : pickItems[0];

      // step 2: select a task -> compose tasks list from the specified project by the existing sorted 'intent's
      const tasksByProject = filter(this.tasks, ["__wsFolder", selected]);
      const intents = sortBy(uniq(map(tasksByProject, "__intent")));
      pickItems = [];
      each(intents, (intent) => {
        // add a group separator
        if (isMatchDeploy(intent) || isMatchBuild(intent)) {
          pickItems.push({ label: intent, kind: QuickPickItemKind.Separator });
          pickItems.push(...filter(tasksByProject, ["__intent", intent]));
        } else {
          // add a special item --> 'Miscellaneous' group
          pickItems.push({ label: MISC, kind: QuickPickItemKind.Separator });
          pickItems.push({ label: MISC, type: "intent" });
        }
      });
      selected = await this.showQuickPick(pickItems, { placeHolder: "select the task you want to perform:" });

      // step 3: 'Miscellaneous' item selected --> compose the available `other` tasks list for all projects
      if (isEqual(selected, { label: MISC, type: "intent" })) {
        selected = await this.showQuickPick(
          filter(tasksByProject, (_) => {
            return !isMatchDeploy(_.__intent) && !isMatchBuild(_.__intent);
          }),
          {
            placeHolder: "select the task you want to perform:",
          }
        );
      }

      return this.setSelectedTask(selected);
    } catch (e: any) {
      getLogger().debug(`Task selection failed: ${e.toString()}`);
      if (e.message !== task_selection_canceled) {
        window.showErrorMessage(e.toString());
      }
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
