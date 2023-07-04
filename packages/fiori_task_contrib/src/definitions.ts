import { ConfiguredTask } from "@sap_oss/task_contrib_types";

export const NPM_TYPE = "npm";
export const NPM_TASK_TYPE = "Miscellaneous";

export interface NpmDefinitionType extends ConfiguredTask {
  taskType: string;
  script: string;
  path: string;
  detail: string;
}
