import { ConfiguredTask } from "@sap_oss/task_contrib_types";

export function serializeTask(task: ConfiguredTask): string {
  return JSON.stringify(task);
}
