import { ConfigurationTarget, Uri, window, workspace } from "vscode";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { getLogger } from "../logger/logger-wrapper";
import { TaskTreeItem } from "../view/task-tree-item";
import { serializeTask } from "../utils/task-serializer";
import { messages } from "../i18n/messages";
import { getSWA } from "../utils/swa";
import { disposeTaskEditorPanel, getTaskEditor } from "../panels/panels-handler";
import { cleanTasks } from "../utils/ws-folder";

export async function deleteTask(treeItem: TaskTreeItem): Promise<void> {
  if (treeItem.command?.arguments === undefined) {
    return;
  }
  const task = treeItem.command.arguments[0];

  if (
    (await window.showInformationMessage(messages.delete_task_confirmation(task.label), { modal: true }, "Delete")) ===
    "Delete"
  ) {
    getSWA().track(messages.SWA_DELETE_TASK_EVENT(), [
      messages.SWA_TASK_EXPLORER_PARAM(),
      task.__intent,
      task.__extensionName,
    ]);

    const taskEditor = getTaskEditor();
    if (taskEditor !== undefined && taskEditor.getTask().label === treeItem.label) {
      disposeTaskEditorPanel();
    }

    const wsFolderPath = task.__wsFolder;
    const taskIndex = task.__index;
    const tasksConfig = workspace.getConfiguration("tasks", Uri.file(wsFolderPath));
    const tasks: ConfiguredTask[] = tasksConfig.get("tasks") ?? [];
    cleanTasks(tasks);
    if (tasks.length > taskIndex) {
      tasks.splice(taskIndex, 1);
      await tasksConfig.update("tasks", tasks, ConfigurationTarget.WorkspaceFolder);
      getLogger().debug(messages.DELETE_TASK(serializeTask(task)));
    } else {
      getLogger().error(messages.TASK_DELETE_FAILED(), { taskIndex, legth: tasks.length });
    }
  }
}
