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
import { revealTask } from "./commands/reveal-task";
import { duplicateTask } from "./commands/duplicate-task";
import { terminateTaskFromTree } from "./commands/terminate-task";

let extensionPath = "";

export async function activate(context: ExtensionContext): Promise<void> {
  extensionPath = context.extensionPath;
  const outputChannel = window.createOutputChannel(TASKS_EXPLORER_ID);
  initializeLogger(context, outputChannel);

  const contributors = Contributors.getInstance();
  const tasksProvider = new TasksProvider(contributors);
  const tasksTree = new TasksTree(tasksProvider);

  context.subscriptions.push(
    commands.registerCommand("tasks-explorer.editTask", partial(editTreeItemTask, tasksProvider, readResource))
  );
  context.subscriptions.push(commands.registerCommand("tasks-explorer.deleteTask", deleteTask));
  context.subscriptions.push(commands.registerCommand("tasks-explorer.revealTask", revealTask));
  context.subscriptions.push(commands.registerCommand("tasks-explorer.duplicateTask", duplicateTask));
  context.subscriptions.push(commands.registerCommand("tasks-explorer.executeTask", executeTaskFromTree));
  context.subscriptions.push(commands.registerCommand("tasks-explorer.stopTask", terminateTaskFromTree));
  context.subscriptions.push(
    commands.registerCommand("tasks-explorer.createTask", partial(createTask, tasksProvider, readResource))
  );
  context.subscriptions.push(commands.registerCommand("tasks-explorer.tree.refresh", () => tasksTree.onChange()));

  context.subscriptions.push(window.registerTreeDataProvider("tasksPanel", tasksTree));

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
