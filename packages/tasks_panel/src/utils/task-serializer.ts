import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { randomBytes } from "crypto";

export function serializeTask(task: ConfiguredTask): string {
  return JSON.stringify(task);
}

export function generateUniqueCode(): string {
  function generateGroup(): string {
    return randomBytes(2).toString("hex").toUpperCase();
  }
  return `${generateGroup()}-${generateGroup()}`;
}
