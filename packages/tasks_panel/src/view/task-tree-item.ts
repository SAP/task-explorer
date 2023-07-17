import { find } from "lodash";
import { getLogger } from "../logger/logger-wrapper";
import { TreeItem, TreeItemCollapsibleState, Command, Task, tasks } from "vscode";

type TaskStatus = "idle" | "running";

export class IntentTreeItem extends TreeItem {
  constructor(public label: string, public collapsibleState: TreeItemCollapsibleState) {
    super(label, collapsibleState);
    this.contextValue = "intent";
  }
}
export class TaskTreeItem extends TreeItem {
  constructor(
    public index: number,
    public type: string,
    public label: string,
    public wsFolder: string,
    public collapsibleState: TreeItemCollapsibleState,
    public command?: Command
  ) {
    super(label, collapsibleState);
    const task = this.command?.arguments?.[0];
    if (task) {
      this.contextValue = `task--${getTaskStatus(task)}`;
    }
  }
}

function getTaskStatus(task: any): TaskStatus {
  return find(tasks.taskExecutions, (_) => {
    return _.task.name === task.label && _.task.source === task.type;
  })
    ? "running"
    : "idle";
}
