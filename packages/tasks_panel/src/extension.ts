import { partial } from "lodash";
import { commands, ExtensionContext, OutputChannel, window } from "vscode";
import { createExtensionLoggerAndSubscribeToLogSettingsChanges } from "./logger/logger-wrapper";
import { Contributors } from "./services/contributors";
import { TasksProvider } from "./services/tasks-provider";
import { TasksTree } from "./view/tasks-tree";
import { executeTaskFromTree } from "./commands/execute-task";
import { deleteTask } from "./commands/delete-task";
import { editTreeItemTask } from "./commands/edit-task";
import { createTask } from "./commands/create-task";
import { messages } from "./i18n/messages";
import { TASKS_EXPLORER_ID } from "./logger/settings";
import { readResource } from "./utils/resource-reader";

let extensionPath = "";

export async function activate(context: ExtensionContext): Promise<void> {
  extensionPath = context.extensionPath;
  const outputChannel = window.createOutputChannel(TASKS_EXPLORER_ID);
  initializeLogger(context, outputChannel);
  // const logger = getLogger();
  // const swa = new SWATracker(
  //   "SAPSE",
  //   "vscode-tasks-explorer-tasks-panel",
  //   // We ignore error code `204` because it appears in every user interaction.
  //   (err: string | number) => {
  //     if (err !== 204) {
  //       logger.error(err.toString());
  //     }
  //   }
  // );

  // initSWA(swa);

  const contributors = Contributors.getInstance();
  const tasksProvider = new TasksProvider(contributors);
  const tasksTree = new TasksTree(tasksProvider);

  commands.registerCommand("tasks-explorer.editTask", partial(editTreeItemTask, readResource));
  commands.registerCommand("tasks-explorer.deleteTask", deleteTask);
  commands.registerCommand("tasks-explorer.executeTask", executeTaskFromTree);
  commands.registerCommand("tasks-explorer.createTask", partial(createTask, tasksProvider, readResource));

  window.registerTreeDataProvider("tasksPanel", tasksTree);

  contributors.init();
}

function initializeLogger(context: ExtensionContext, outputChannel: OutputChannel): void {
  try {
    createExtensionLoggerAndSubscribeToLogSettingsChanges(context, outputChannel);
  } catch (error) {
    outputChannel.appendLine(messages.LOGGER_NOT_AVAILABLE());
  }
}

export function getExtensionPath(): string {
  return extensionPath;
}
