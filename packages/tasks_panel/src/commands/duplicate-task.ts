import { ConfigurationTarget, Uri, window, workspace } from "vscode";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { getLogger } from "../logger/logger-wrapper";
import { TaskTreeItem } from "../view/task-tree-item";
import { messages } from "../i18n/messages";
import { cleanTasks } from "../utils/ws-folder";
import { cloneDeep, filter, find, map } from "lodash";

export async function duplicateTask(treeItem: TaskTreeItem): Promise<void> {
  try {
    if (treeItem.command?.arguments === undefined) {
      return;
    }
    const task = treeItem.command.arguments[0];

    const tasksConfig = workspace.getConfiguration("tasks", Uri.file(task.__wsFolder));
    const tasks: ConfiguredTask[] = tasksConfig.get("tasks") ?? [];
    cleanTasks(tasks);
    const tasksByType = filter(tasks, ["type", task.type]);
    const found = find(tasksByType, ["label", task.label]);
    if (found) {
      const labels = map(tasksByType, "label");
      let copyName = found.label;
      while (labels.includes(copyName)) {
        copyName = `copy of ${copyName}`;
      }
      const copyTask = cloneDeep(found);
      copyTask.label = copyName;
      tasks.push(copyTask);
      await tasksConfig.update("tasks", tasks, ConfigurationTarget.WorkspaceFolder);
    } else {
      throw new Error(messages.configuration_task_not_found(task.label));
    }
  } catch (e) {
    const message = (e as any).toString();
    window.showErrorMessage(message);
    getLogger().error(`duplicateTask: processing failed`, { message });
  }
}
