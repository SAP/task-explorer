import { ConfigurationTarget, Uri, workspace, window, WebviewPanel } from "vscode";
import { ConfiguredTask, TaskEditorContributionAPI } from "@sap_oss/task_contrib_types";

import { AppEvents } from "./app-events";
import { Contributors } from "./services/contributors";
import { IContributors } from "./services/definitions";
import { executeVScodeTask } from "./services/tasks-executor";
import { getLogger } from "./logger/logger-wrapper";
import { messages } from "./i18n/messages";
import { cleanTasks } from "./utils/ws-folder";

export class VSCodeEvents implements AppEvents {
  private readonly contributors: IContributors;

  constructor(private webviewPanel: WebviewPanel) {
    this.contributors = Contributors.getInstance();
  }

  async executeTask(task: ConfiguredTask): Promise<void> {
    return executeVScodeTask(task);
  }

  async updateTaskInConfiguration(path: string, task: ConfiguredTask, index: number): Promise<void> {
    const tasksConfig = workspace.getConfiguration("tasks", Uri.file(path));
    const tasks: ConfiguredTask[] = tasksConfig.get("tasks") ?? [];
    if (tasks.length > index) {
      tasks[index] = task;
      cleanTasks(tasks);
      await tasksConfig.update("tasks", tasks, ConfigurationTarget.WorkspaceFolder);
    } else {
      getLogger().error(messages.TASK_UPDATE_FAILED(index, tasks.length));
      window.showErrorMessage(messages.TASK_UPDATE_FAILED(index, tasks.length));
      return;
    }
    // change tab name on save
    this.webviewPanel.title = task.label;
  }

  getTasksEditorContributor(type: string): TaskEditorContributionAPI<ConfiguredTask> {
    return this.contributors.getTaskEditorContributor(type);
  }

  async addTaskToConfiguration(path: string, task: ConfiguredTask): Promise<number> {
    const tasksConfig = workspace.getConfiguration("tasks", Uri.file(path));
    let configuredTasks: ConfiguredTask[] = tasksConfig.get("tasks") ?? [];
    configuredTasks = configuredTasks.concat(task);
    cleanTasks(configuredTasks);
    await tasksConfig.update("tasks", configuredTasks);
    return configuredTasks.length - 1;
  }

  getTaskPropertyDescription(type: string, property: string): string {
    return this.contributors.getTaskPropertyDescription(type, property);
  }
}
