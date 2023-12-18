import { TreeItem, TreeView, window } from "vscode";
import { TasksTree } from "../view/tasks-tree";
import { ITasksProvider } from "../services/definitions";
import { runQaCommand } from "./action";

export async function actionDeploy(
  view: TreeView<TreeItem>,
  dataProvider: TasksTree,
  taskProvider: ITasksProvider
): Promise<void> {
  try {
    await runQaCommand("deploy", dataProvider, taskProvider);
  } catch (error) {
    void window.showWarningMessage((error as any).message);
  }
}
