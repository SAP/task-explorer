import { commands, window } from "vscode";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { messages } from "../i18n/messages";
import { getSWA } from "../utils/swa";
import { createTaskEditorPanel, getTaskEditorPanel, getTaskInProcess } from "../panels/panels-handler";
import { ITasksProvider } from "../services/definitions";
import { find, has, isMatch } from "lodash";
import { serializeTask } from "../utils/task-serializer";
import { getLogger } from "../logger/logger-wrapper";

export async function editTreeItemTask(
  tasksProvider: ITasksProvider,
  readResource: (file: string) => Promise<string>,
  task?: ConfiguredTask
): Promise<void> {
  function isConfiguredTask(task: ConfiguredTask): boolean {
    return has(task, "__intent");
  }

  let cmdTask;
  if (task && !isConfiguredTask(task)) {
    cmdTask = task;
    // request for edit task programmatically
    task = find(await tasksProvider.getConfiguredTasks(), (_) => {
      return isMatch(_, task as ConfiguredTask);
    });
  }

  if (task) {
    return editTask(task, readResource);
  } else if (cmdTask) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- verified above
    getLogger().debug(messages.EDIT_TASK_NOT_FOUND(serializeTask(cmdTask)));
  }
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
      void commands.executeCommand("tasks-explorer.tree.select", getTaskEditorPanel()?.getLoadedTask());
      return;
    }
  }

  return createTaskEditorPanel(task, readResource);
}
