import { Task, WorkspaceFolder, commands, tasks, window } from "vscode";
import { find } from "lodash";
import { getLogger } from "../logger/logger-wrapper";
import { messages } from "../i18n/messages";
import { serializeTask } from "../utils/task-serializer";

export async function executeVScodeTask(task: any): Promise<void> {
  const findConfiguredNpmTask = (tasks: Task[]): Task | void => {
    if (task.type === "npm") {
      return find(tasks, (_) => {
        return (
          _.definition.script === task.script &&
          _.definition.path === task.path &&
          (_.scope instanceof Object ? (_.scope as WorkspaceFolder).uri.path === task.__wsFolder : false)
        );
      });
    }
  };
  const allTasks = await tasks.fetchTasks({ type: task.type });

  const taskForExecution = find(allTasks, ["name", task.label]) || findConfiguredNpmTask(allTasks);

  try {
    if (taskForExecution !== undefined) {
      if (taskForExecution.name !== task.label) {
        // implementation hack to support `npm` tasks
        taskForExecution.name = task.label;
      }
      const listener = tasks.onDidEndTask((e) => {
        if (e.execution.task.name === taskForExecution.name) {
          // update the tree items context value [running -> idle]
          void commands.executeCommand("tasks-explorer.tree.refresh");
          listener.dispose();
        }
      });
      await tasks.executeTask(taskForExecution);
      // update the tree items context value [idle -> running]
      void commands.executeCommand("tasks-explorer.tree.refresh");
    } else {
      getLogger().error(messages.MISSING_EXECUTION_TASK());
    }
  } catch (error: any) {
    getLogger().error(messages.EXECUTE_FAILURE(serializeTask(task)));
    void window.showErrorMessage(error.message);
  }
}
