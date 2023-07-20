import { filter, map, uniq, sortBy } from "lodash";
import { IntentTreeItem, ProjectTreeItem, TaskTreeItem } from "./task-tree-item";
import {
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  workspace,
  Uri,
  ProviderResult,
} from "vscode";
import { ITasksProvider } from "../services/definitions";
import { getClassLogger } from "../logger/logger-wrapper";
import { messages } from "../i18n/messages";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";

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

  private filterByFolder(tasks: ConfiguredTask[], parent?: ProjectTreeItem): ConfiguredTask[] {
    return parent ? filter(tasks, ["__wsFolder", parent.fqn]) : tasks;
  }

  private getIntents(tasks: ConfiguredTask[], parent?: ProjectTreeItem): IntentTreeItem[] {
    const intents = sortBy(uniq(map(this.filterByFolder(tasks, parent), "__intent")));
    getClassLogger(LOGGER_CLASS_NAME).debug(messages.GET_TREE_BRANCHES("intent", intents.length));
    return map(intents, (_) => new IntentTreeItem(_, TreeItemCollapsibleState.Collapsed, parent));
  }

  private getWorkspaces(wsFolders: string[]): IntentTreeItem[] {
    getClassLogger(LOGGER_CLASS_NAME).debug(messages.GET_TREE_BRANCHES("workspace", wsFolders.length));
    return map(
      wsFolders,
      (_) =>
        new ProjectTreeItem(
          workspace.getWorkspaceFolder(Uri.file(_))?.name ?? "",
          _,
          TreeItemCollapsibleState.Collapsed
        )
    );
  }

  private getRoots(tasks: ConfiguredTask[]): TreeItem[] {
    const wsFolders = uniq(map(tasks, "__wsFolder"));
    return wsFolders.length === 1 ? this.getIntents(tasks) : this.getWorkspaces(wsFolders);
  }

  private async getIntentChildren(tasks: ConfiguredTask[], element: TreeItem) {
    tasks = this.filterByFolder(tasks, (await this.getParent(element)) as ProjectTreeItem | undefined);
    const children = map(
      filter(tasks, ["__intent", element.label]),
      (task) =>
        new TaskTreeItem(task.__index, task.type, task.label, task.__wsFolder, TreeItemCollapsibleState.None, element, {
          command: "tasks-explorer.editTask",
          title: "Edit Task",
          arguments: [task],
        })
    );
    /* istanbul ignore next */
    getClassLogger(LOGGER_CLASS_NAME).debug(messages.GET_TREE_CHILDREN_BY_INTENT(element.label ?? "", children.length));
    return children;
  }

  public async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    const tasks = await this.tasksProvider.getConfiguredTasks();
    if (element === undefined) {
      return this.getRoots(tasks);
    } else if (element instanceof ProjectTreeItem) {
      return this.getIntents(tasks, element);
    } else {
      return this.getIntentChildren(tasks, element);
    }
  }

  public getTreeItem(treeItem: TaskTreeItem): TreeItem {
    return treeItem;
  }

  public async onChange(): Promise<void> {
    this.onDidModify();
  }

  public getParent(element: TreeItem): ProviderResult<TreeItem> {
    return (element as any).parent;
  }
}
