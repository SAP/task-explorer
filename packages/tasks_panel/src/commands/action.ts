import {
  workspace,
  window,
  QuickPickItem,
  commands,
  TreeItemCollapsibleState,
  Task,
  QuickPickItemKind,
  tasks,
  TaskStartEvent,
  Disposable,
} from "vscode";
import { cloneDeep, debounce, extend, find, reduce } from "lodash";
import { ITasksProvider } from "../services/definitions";
import { IntentTreeItem, ProjectTreeItem } from "../view/task-tree-item";
import { TasksTree } from "../view/tasks-tree";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { getLogger } from "../logger/logger-wrapper";
import { isMatchBuild, isMatchDeploy } from "../utils/ws-folder";

export type QaCommandKind = "build" | "deploy";
const CREATE_TASK = "Create Task...";
export let lastPickedItem: QuickPickItem | undefined;
const lastRunTask: { build: Task | undefined; deploy: Task | undefined } = { build: undefined, deploy: undefined };
const LAST_RUN_TASK = "lastRunTask";

export function subscribeLastTaskRun(): Disposable {
  function isDeployTask(task: Task): boolean {
    return isMatchDeploy(task.definition.type) || isMatchDeploy(task.name);
  }
  function isBuildTask(task: Task): boolean {
    return isMatchBuild(task.definition.type) || isMatchBuild(task.name);
  }
  // keep last task run in session memory
  return tasks.onDidStartTask((e: TaskStartEvent) => {
    const { task } = e.execution;
    if (isDeployTask(task)) {
      lastRunTask.deploy = task;
    } else if (isBuildTask(task)) {
      lastRunTask.build = task;
    }
  });
}

// debounce should prevent running multiple instances at once
export const runQaCommand = debounce(
  async (kind: QaCommandKind, dataProvider: TasksTree, taskProvider: ITasksProvider) => {
    async function executeCreateTaskCommand(): Promise<void> {
      return commands.executeCommand(
        "tasks-explorer.createTask",
        new IntentTreeItem(kind, TreeItemCollapsibleState.Collapsed, new ProjectTreeItem("", ""))
      );
    }

    function collectItems(tasks: ConfiguredTask[]): QuickPickItem[] {
      const lastRun = kind === "build" ? lastRunTask.build : lastRunTask.deploy;
      let lastRunItem: ConfiguredTask | undefined;
      const items = reduce(
        tasks,
        (result: QuickPickItem[], task: ConfiguredTask) => {
          if (lastRun?.name === task.label && lastRun?.definition.type === task.type) {
            lastRunItem = task;
          } else {
            result.push(
              extend({ ...task }, { description: task.type }, task.description ? { detail: task.description } : {})
            );
          }
          return result;
        },
        []
      );
      items.push({ kind: QuickPickItemKind.Separator, label: "configure" }, { label: CREATE_TASK });

      if (lastRunItem) {
        // pushing the last run item to top of the list (vscode not providing another way to select default item..)
        items.unshift(
          { kind: QuickPickItemKind.Separator, label: "Last Run" },
          extend(
            { ...lastRunItem },
            { description: lastRunItem.type },
            lastRunItem.description ? { detail: lastRunItem.description } : {}
          ),
          { kind: QuickPickItemKind.Separator, label: "" }
        );
      }
      return items;
    }
    function pickItem2ConfiguredTask(item: QuickPickItem): ConfiguredTask {
      const task = cloneDeep(item);
      const description = task.detail;
      delete task.description;
      delete task.detail;
      if (description) {
        task.description = description;
      }
      return task as ConfiguredTask;
    }

    async function showQuickPick(tasks: ConfiguredTask[]): Promise<void> {
      lastPickedItem = await window.showQuickPick(collectItems(tasks), {
        placeHolder: "What would you like to run?",
        ignoreFocusOut: true,
      });
      if ((<any>lastPickedItem)?.type) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- verified in the line above
        return runTask(pickItem2ConfiguredTask(lastPickedItem!));
      } else if (lastPickedItem?.label === CREATE_TASK) {
        return executeCreateTaskCommand();
      }
    }

    async function runTask(task: ConfiguredTask): Promise<void> {
      const taskItem = await dataProvider.findTreeItem(task);
      if (taskItem) {
        void commands.executeCommand("tasks-explorer.tree.select", task);
        return commands.executeCommand("tasks-explorer.executeTask", taskItem);
      } else {
        getLogger().error(`Internal: task not found in the tree data structure`, {
          label: task.label,
          type: task.type,
        });
      }
    }
    // if no open workspace - show warning
    if (!workspace.workspaceFolders?.length) {
      throw new Error(`You have no open projects. Open the project you want to ${kind.toString()} and try again.`);
    }

    const allTasks = await taskProvider.getConfiguredTasks();
    const matcher = kind === "build" ? isMatchBuild : isMatchDeploy;
    const tasks = allTasks.filter((task) => matcher(task.__intent));
    // should show quick pick only for the first time in a session
    if (!lastPickedItem) {
      if (!tasks?.length) {
        // tasks not found -> query for task creation with specified intent/group
        return executeCreateTaskCommand();
      } else if (tasks.length === 1) {
        return runTask(tasks[0]);
      }
      return showQuickPick(tasks);
    } else {
      if ((<any>lastPickedItem)?.type) {
        const lastRun = kind === "build" ? lastRunTask.build : lastRunTask.deploy;
        if (lastRun) {
          const found = find(tasks, (task) => {
            return task.label === lastRun?.name && task.type === lastRun?.definition.type;
          });
          if (found) {
            return runTask(found);
          }
        }
      }
      // fallback in cases:
      // 1. didn't find last run task
      // 2. selected quick pick item - `Create Task...`
      return showQuickPick(tasks);
    }
  },
  500
);
