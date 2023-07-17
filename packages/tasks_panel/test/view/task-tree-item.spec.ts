import { expect } from "chai";
import { mockVscode, resetTestVSCode, testVscode } from "../utils/mockVSCode";
import { IntentTreeItem, TaskTreeItem } from "../../src/view/task-tree-item";
import { TreeItemCollapsibleState } from "vscode";
import { stub } from "sinon";

mockVscode("src/view/tasks-tree-item");

describe("IntentTreeItem class", () => {
  afterEach(() => {
    resetTestVSCode();
  });

  it("IntenTreeItem instance virifying", () => {
    const label = "my-label";
    const item = new IntentTreeItem(label, TreeItemCollapsibleState.Expanded);
    expect(item.collapsibleState).to.be.equal(TreeItemCollapsibleState.Expanded);
    expect(item.label).to.be.equal(label);
    expect(item.contextValue).to.be.equal("intent");
  });
});

describe("TaskTreeItem class", () => {
  afterEach(() => {
    resetTestVSCode();
  });
  const label = "my-label";
  const index = 3;
  const type = "myType";
  const wsFolder = "/my/path";
  const state = TreeItemCollapsibleState.Expanded;

  it("TaskTreeItem instance structure", () => {
    const item = new TaskTreeItem(index, type, label, wsFolder, state);
    expect(item.collapsibleState).to.be.equal(state);
    expect(item.label).to.be.equal(label);
    expect(item.type).to.be.equal(type);
    expect(item.index).to.be.equal(index);
    expect(item.wsFolder).to.be.equal(wsFolder);
    expect(item.contextValue).to.be.undefined;
  });

  it("TaskTreeItem instance, with command", () => {
    const command = { title: "title", command: "command", arguments: [{ name: "name" }] };
    const item = new TaskTreeItem(index, type, label, wsFolder, state, command);
    expect(item.command).to.be.deep.equal(command);
    expect(item.contextValue).to.be.equal("task--idle");
  });

  it("TaskTreeItem instance, with command, running", () => {
    stub(testVscode.tasks, "taskExecutions").value([{ task: { name: label, source: type } }]);
    const command = { title: "title", command: "command", arguments: [{ label, type }] };
    const item = new TaskTreeItem(index, type, label, wsFolder, state, command);
    expect(item.contextValue).to.be.equal("task--running");
  });
});
