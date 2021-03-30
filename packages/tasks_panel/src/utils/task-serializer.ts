import { ConfiguredTask } from "@vscode-tasks-explorer/task_contrib_types";

export function serializeTask(task: ConfiguredTask): string {
  return JSON.stringify(task);
}
