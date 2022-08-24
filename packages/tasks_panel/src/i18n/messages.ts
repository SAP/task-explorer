export const messages = {
  LOGGER_NOT_AVAILABLE: (): string => `Logs are not available for the Task Explorer Extension.`,
  TASK_UPDATE_FAILED: (indexId: number, length: number): string =>
    `Could not update the task with index ${indexId} in the tasks configuration because the configuration length is ${length}. `,
  TASK_DELETE_FAILED: (indexId: number, length: number): string =>
    `Could not delete the task with index ${indexId} in the tasks configuration because the configuration length is ${length}. `,
  DISCARD_CHANGES_BUTTON_TEXT: (): string => `Discard Changes`,
  MISSING_EXECUTION_TASK: (): string => `The Execution task is missing.`,
  MISSING_AUTO_DETECTED_TASKS: (): string =>
    `There are currently no tasks that are relevant for your workspace content.`,
  CONFIG_CHANGED: (): string => `The configuration has been changed.`,
  GET_TREE_INTENTS: (intents: number): string => `${intents} intents retrieved.`,
  GET_TREE_CHILDREN_BY_INTENT: (intent: string, tasks: number): string =>
    `${tasks} tasks retrieved for intent ${intent}.`,
  ACTIVATE_CONTRIB_EXT_ERROR: (extensionId: string): string => `Could not activate the ${extensionId} extension.`,
  SWITCH_UNSAVED_TASK: (taskInProcess: string): string =>
    `You have unsaved changes in the "${taskInProcess}" task. \n` +
    `The changes will be discarded. \n` +
    `Click "Close" to return to the "${taskInProcess}" task or "Discard Changes" to continue.`,
  DELETE_TASK: (task: string): string => `tasks-explorer.deleteTask command. got task: ${task}`,
  EDIT_TASK: (task: string): string => `tasks-explorer.editTask command. got task: ${task}`,
  EXECUTE_TASK: (task: string): string => `Executed task: ${task}`,
  CREATE_TASK: (task: string): string => `Created task: ${task}`,
  MISSING_TYPE: (type: string): string => `The type "${type}" is missing.`,
  DUPLICATED_TYPE: (type: string): string => `The type "${type}" is already contributed.`,
  EXECUTE_FAILURE: (task: string): string => `Could not execute the task: ${task}`,
  EVALUATED_METHOD_FAILURE: (methodName: string, questionName: string, params: string, err: Error): string =>
    `Call to "${methodName}" method of property "${questionName}" with params: ${params}. Failed with error: ${err}`,
  METHOD_NOT_FOUND: (methodName: string, questionName: string, params: string): string =>
    `Could not find the "${methodName}" method in "${questionName}" with params: ${params}`,
  GET_IMAGE_FAILURE: (imagePath: string, err: Error): string =>
    `Could not get the image from the given path: "${imagePath}". Failed with error: ${err}`,
  LABEL_IS_NOT_UNIQUE: (): string => `Enter a unique value.`,
  MANDATORY_FIELD: (): string => `Mandatory field`,
  SWA_SAVE_TASK_EVENT: (): string => `Save`,
  SWA_CREATE_TASK_EVENT: (): string => `Create`,
  SWA_EXECUTE_TASK_EVENT: (): string => `Execute`,
  SWA_DELETE_TASK_EVENT: (): string => `Delete`,
  SWA_EDIT_TASK_EVENT: (): string => `Edit`,
  SWA_TASK_EXPLORER_PARAM: (): string => `Explorer`,
  SWA_TASK_EDITOR_PARAM: (): string => `Editor`,
};
