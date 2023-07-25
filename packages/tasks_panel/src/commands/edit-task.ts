import { window } from "vscode";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { TaskTreeItem } from "../view/task-tree-item";
import { messages } from "../i18n/messages";
import { getSWA } from "../utils/swa";
import { createTaskEditorPanel, disposeTaskSelectionPanel, getTaskInProcess } from "../panels/panels-handler";
import { ITasksProvider } from "../services/definitions";
import { find, has } from "lodash";
import { serializeTask } from "../utils/task-serializer";
import { getLogger } from "../logger/logger-wrapper";

export async function editTreeItemTask(
  tasksProvider: ITasksProvider,
  readResource: (file: string) => Promise<string>,
  treeItem: TaskTreeItem
): Promise<void> {
  function isConfiguredTask(task: ConfiguredTask): boolean {
    return has(task, "__intent");
  }
  let task = treeItem.command?.arguments?.[0];
  const isTaskAttached = !!task;

  if (task && !isConfiguredTask(task)) {
    // request for edit task programmatically
    task = find(await tasksProvider.getConfiguredTasks(), { type: task.type, label: task.label });
  }

  if (task) {
    return editTask(task, readResource);
  } else if (isTaskAttached) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- verified above
    getLogger().debug(messages.EDIT_TASK_NOT_FOUND(serializeTask(treeItem.command!.arguments![0])));
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
      return;
    }
  }

  await disposeTaskSelectionPanel();

  return createTaskEditorPanel(task, readResource);
}
