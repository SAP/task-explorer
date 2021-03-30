import { TreeItem, TreeItemCollapsibleState, Command } from "vscode";

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
    if (command !== undefined) {
      this.contextValue = "task";
    }
  }
}
