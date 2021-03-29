import { tasks, window } from "vscode";
import { find } from "lodash";
import { getLogger } from "../logger/logger-wrapper";
import { messages } from "../i18n/messages";
import { serializeTask } from "../utils/task-serializer";

export async function executeVScodeTask(task: any): Promise<void> {
  const allTasks = await tasks.fetchTasks();
  const taskForExecution = find(allTasks, (_) => {
    return task.label === _.name;
  });
  try {
    if (taskForExecution !== undefined) {
      await tasks.executeTask(taskForExecution);
    } else {
      getLogger().error(messages.MISSING_EXECUTION_TASK());
    }
  } catch (error) {
    getLogger().error(messages.EXECUTE_FAILURE(serializeTask(task)));
    await window.showErrorMessage(error.message);
  }
}
