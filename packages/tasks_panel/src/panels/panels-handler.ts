import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { TaskEditorPanel } from "./task-editor-panel";
import { getLogger } from "../logger/logger-wrapper";
import { messages } from "../i18n/messages";
import { serializeTask } from "../utils/task-serializer";
import { TaskEditor } from "../task-editor";
import { VSCodeEvents } from "../vscode-events";
import { TasksSelection } from "../tasks-selection";

let taskEditorPanel: TaskEditorPanel | undefined;

export async function createTasksSelection(
  tasks: ConfiguredTask[],
  readResource: (file: string) => Promise<string>,
  project?: string
): Promise<void> {
  return new TasksSelection(new VSCodeEvents(), tasks, readResource).select(project);
}

export async function createTaskEditorPanel(
  task: ConfiguredTask,
  readResource: (file: string) => Promise<string>
): Promise<void> {
  disposeTaskEditorPanel();
  taskEditorPanel = new TaskEditorPanel(task, readResource);
  await taskEditorPanel.initWebviewPanel();
  getLogger().debug(messages.EDIT_TASK(serializeTask(task)));
}

export function disposeTaskEditorPanel(): void {
  if (taskEditorPanel !== undefined) {
    taskEditorPanel.dispose();
    taskEditorPanel = undefined;
  }
}

export function getTaskInProcess(): string | undefined {
  return taskEditorPanel?.getTaskInProcess();
}

export function getTaskEditor(): TaskEditor | undefined {
  return taskEditorPanel?.getTaskEditor();
}

export function getTaskEditorPanel(): TaskEditorPanel | undefined {
  return taskEditorPanel;
}
