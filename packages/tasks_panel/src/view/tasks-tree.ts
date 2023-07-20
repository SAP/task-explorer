import { filter, map, uniq } from "lodash";
import { IntentTreeItem, TaskTreeItem } from "./task-tree-item";
import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState, workspace } from "vscode";
import { ITasksProvider } from "../services/definitions";
import { getClassLogger } from "../logger/logger-wrapper";
import { messages } from "../i18n/messages";

const LOGGER_CLASS_NAME = "Tasks Tree";

export class TasksTree implements TreeDataProvider<TreeItem> {
  private readonly _onDidChangeTreeData: EventEmitter<TaskTreeItem | null> = new EventEmitter<TaskTreeItem | null>();
  readonly onDidChangeTreeData: Event<TaskTreeItem | null> = this._onDidChangeTreeData.event;

  constructor(private readonly tasksProvider: ITasksProvider) {
    this.tasksProvider.registerEventHandler(this);
    workspace.onDidChangeConfiguration(async () => {
      getClassLogger(LOGGER_CLASS_NAME).debug(messages.CONFIG_CHANGED());
      this.onDidModify();
    });
  }

  public onDidModify(): void {
    this._onDidChangeTreeData.fire(null);
  }

  public async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    const tasks = await this.tasksProvider.getConfiguredTasks();
    if (element === undefined) {
      const intents = uniq(map(tasks, (_) => _.__intent));
      getClassLogger(LOGGER_CLASS_NAME).debug(messages.GET_TREE_INTENTS(intents.length));
      return map(intents, (_) => new IntentTreeItem(_, TreeItemCollapsibleState.Collapsed));
    }
    const intent = element.label ?? "";
    const tasksByIntent = filter(tasks, (_) => _.__intent === intent);
    const result = map(
      tasksByIntent,
      (task) =>
        new TaskTreeItem(task.__index, task.type, task.label, task.__wsFolder, TreeItemCollapsibleState.None, {
          command: "tasks-explorer.editTask",
          title: "Edit Task",
          arguments: [task],
        })
    );
    getClassLogger(LOGGER_CLASS_NAME).debug(messages.GET_TREE_CHILDREN_BY_INTENT(intent, result.length));
    return result;
  }

  public getTreeItem(treeItem: TaskTreeItem): TreeItem {
    return treeItem;
  }

  public async onChange(): Promise<void> {
    this.onDidModify();
  }
}
