import { TreeItem, TreeView } from "vscode";
import { find } from "lodash";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { TasksTree } from "../view/tasks-tree";
import { getLogger } from "../logger/logger-wrapper";
import { messages } from "../i18n/messages";
import { serializeTask } from "../utils/task-serializer";
import { ITasksProvider } from "../services/definitions";

export async function selectTreeItem(
  view: TreeView<TreeItem>,
  dataProvider: TasksTree,
  taskProvider: ITasksProvider,
  task: ConfiguredTask
): Promise<void> {
  const _task = find(await taskProvider.getConfiguredTasks(), { type: task.type, label: task.label });
  if (_task) {
    return dataProvider.findTreeItem(_task).then((treeItem: TreeItem | undefined) => {
      if (treeItem) {
        return view.reveal(treeItem, { select: true, focus: true, expand: true });
      } else {
        getLogger().warn(messages.EDIT_TASK_NOT_FOUND(serializeTask(task)));
      }
    });
  }
}
