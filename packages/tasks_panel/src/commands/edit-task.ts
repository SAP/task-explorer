import { commands, window } from "vscode";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { messages } from "../i18n/messages";
import { getSWA } from "../utils/swa";
import { find, isMatch } from "lodash";
import { createTaskEditorPanel, getTaskEditorPanel, getTaskInProcess } from "../panels/panels-handler";
import { ITasksProvider } from "../../src/services/definitions";
import { getLogger } from "../../src/logger/logger-wrapper";

export async function editTreeItemTask(
  taskProvider: ITasksProvider,
  readResource: (file: string) => Promise<string>,
  task: ConfiguredTask
): Promise<void> {
  const _task = find(await taskProvider.getConfiguredTasks(), (_) => {
    return isMatch(_, task);
  });
  if (_task) {
    return editTask(_task, readResource);
  } else {
    getLogger().debug(`Task edit:: requested task not found`, { label: task.label });
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- verified by condition above
      void commands.executeCommand("tasks-explorer.tree.select", getTaskEditorPanel()!.getLoadedTask());
      return;
    }
  }

  return createTaskEditorPanel(task, readResource);
}
