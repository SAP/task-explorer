import { isEmpty } from "lodash";
import { executeVScodeTask } from "../services/tasks-executor";
import { TaskTreeItem } from "../view/task-tree-item";
import { getSWA } from "../utils/swa";
import { messages } from "../i18n/messages";
import { getLogger } from "../logger/logger-wrapper";
import { serializeTask } from "../utils/task-serializer";

export async function executeTaskFromTree(treeItem: TaskTreeItem): Promise<void> {
  if (treeItem.command?.arguments !== undefined && !isEmpty(treeItem.command.arguments)) {
    const task = treeItem.command.arguments[0];
    getSWA().track(messages.SWA_EXECUTE_TASK_EVENT(), [
      messages.SWA_TASK_EXPLORER_PARAM(),
      task.__intent,
      task.__extensionName,
    ]);
    await executeVScodeTask(task);
    getLogger().debug(messages.EXECUTE_TASK(serializeTask(task)));
  }
}
