import { isFunction } from "lodash";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { AppEvents } from "./app-events";
import { getSWA } from "./utils/swa";
import { getLogger } from "./logger/logger-wrapper";
import { messages } from "./i18n/messages";
import { getUniqueTaskLabel, serializeTask } from "./utils/task-serializer";
import { commands, window } from "vscode";
import { createTaskEditorPanel } from "./panels/panels-handler";
import { multiStepTaskSelect } from "./multi-step-select";
import { ElementTreeItem } from "./view/task-tree-item";
import { completeDeployConfig, isDeploymentConfigTask } from "./misc/common-e2e-config";

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
        return await (isDeploymentConfigTask(task) ? completeDeployConfig(task) : this.setSelectedTask(task));
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

    selectedTask.label = getUniqueTaskLabel(selectedTask.label);

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
    await createTaskEditorPanel(newTask, this.readResource);
    void commands.executeCommand("tasks-explorer.tree.select", selectedTask);
  }
}
