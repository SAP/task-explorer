import { window } from "vscode";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { TaskTreeItem } from "../view/task-tree-item";
import { messages } from "../i18n/messages";
import { getSWA } from "../utils/swa";
import { createTaskEditorPanel, disposeTaskSelectionPanel, getTaskInProcess } from "../panels/panels-handler";

export async function editTreeItemTask(
  readResource: (file: string) => Promise<string>,
  treeItem: TaskTreeItem
): Promise<void> {
  if (treeItem.command?.arguments === undefined) {
    return;
  }

  return editTask(treeItem.command.arguments[0], readResource);
}

export async function editTask(task: ConfiguredTask, readResource: (file: string) => Promise<string>): Promise<void> {
  getSWA().track(messages.SWA_EDIT_TASK_EVENT(), [
    messages.SWA_TASK_EXPLORER_PARAM(),
    task.__intent,
    task.__extensionName,
  ]);

  const taskInProcess = getTaskInProcess();
  if (taskInProcess === task.label) {
    return;
  }

  if (taskInProcess !== undefined) {
    const decision = await window.showInformationMessage(
      messages.SWITCH_UNSAVED_TASK(taskInProcess),
      { modal: true },
      messages.DISCARD_CHANGES_BUTTON_TEXT()
    );
    if (decision !== messages.DISCARD_CHANGES_BUTTON_TEXT()) {
      return;
    }
  }

  await disposeTaskSelectionPanel();

  return createTaskEditorPanel(task, readResource);
}
