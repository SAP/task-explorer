import { ConfiguredTask } from "@sap-oss/task_contrib_types";

export function serializeTask(task: ConfiguredTask): string {
  return JSON.stringify(task);
}
