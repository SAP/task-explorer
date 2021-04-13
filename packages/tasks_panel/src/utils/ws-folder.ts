import { forEach } from "lodash";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";

// this function removes "index" field that Theia adds to the task definition
export function cleanTasks(tasks: ConfiguredTask[]): void {
  forEach(tasks, (_) => {
    delete _.index;
  });
}
