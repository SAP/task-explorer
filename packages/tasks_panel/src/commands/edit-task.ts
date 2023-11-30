import { commands, window } from "vscode";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { messages } from "../i18n/messages";
import { getSWA } from "../utils/swa";
import { createTaskEditorPanel, getTaskEditorPanel, getTaskInProcess } from "../panels/panels-handler";

export async function editTreeItemTask(
  readResource: (file: string) => Promise<string>,
  task: ConfiguredTask
): Promise<void> {
  if (task) {
    return editTask(task, readResource);
  }
}

async function editTask(task: ConfiguredTask, readResource: (file: string) => Promise<string>): Promise<void> {
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
      void commands.executeCommand("tasks-explorer.tree.select", getTaskEditorPanel()?.getLoadedTask());
      return;
    }
  }

  return createTaskEditorPanel(task, readResource);
}
