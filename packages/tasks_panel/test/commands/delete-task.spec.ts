import { expect } from "chai";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import {
  MockConfigTask,
  mockVscode,
  MockVSCodeInfo,
  resetTestVSCode,
} from "../utils/mockVSCode";

mockVscode("../../src/panels/task-editor-panel");
import { deleteTask } from "../../src/commands/delete-task";
import { editTreeItemTask } from "../../src/commands/edit-task";
import { TaskTreeItem } from "../../src/view/task-tree-item";
import { TreeItemCollapsibleState } from "vscode";
import { disposeTaskEditorPanel } from "../../src/panels/panels-handler";

describe("Command deleteTask", () => {
  const readFile = async function (path: string): Promise<string> {
    return "aaa";
  };

  afterEach(() => {
    disposeTaskEditorPanel();
    resetTestVSCode();
  });

  it("task already opened for editing, task panel will be disposed and task deleted", async () => {
    MockVSCodeInfo.configTasks?.set("wsFolder1", [
      new MockConfigTask("aaa", "test"),
    ]);
    const task1: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __index: 0,
      __intent: "Deploy",
      __wsFolder: "wsFolder1",
    };
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task1],
    };
    const item1 = new TaskTreeItem(
      0,
      "test",
      "aaa",
      "wsFolder1",
      TreeItemCollapsibleState.None,
      command1
    );

    await editTreeItemTask(readFile, item1);
    expect(MockVSCodeInfo.webViewCreated).eq(1);
    await deleteTask(item1);
    expect(MockVSCodeInfo.configTasks?.get("wsFolder1")).to.empty;
    expect(MockVSCodeInfo.disposeCalled).eq(true);
  });

  it("task is not opened for editing, task will be deleted", async () => {
    MockVSCodeInfo.configTasks?.set("wsFolder1", [
      new MockConfigTask("aaa", "test"),
    ]);
    const task1: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __index: 0,
      __intent: "Deploy",
      __wsFolder: "wsFolder1",
    };
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task1],
    };
    const item1 = new TaskTreeItem(
      0,
      "test",
      "aaa",
      "wsFolder1",
      TreeItemCollapsibleState.None,
      command1
    );

    await deleteTask(item1);
    expect(MockVSCodeInfo.saveCalled).true;
    expect(MockVSCodeInfo.configTasks?.get("wsFolder1")).to.empty;
  });

  it("tasks configuration is undefined, configuration is not updated", async () => {
    MockVSCodeInfo.configTasks = new Map<string, MockConfigTask[]>();
    const task1: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __index: 0,
      __intent: "Deploy",
      __wsFolder: "wsFolder1",
    };
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task1],
    };
    const item1 = new TaskTreeItem(
      0,
      "test",
      "aaa",
      "wsFolder1",
      TreeItemCollapsibleState.None,
      command1
    );

    await deleteTask(item1);
    expect(MockVSCodeInfo.saveCalled).false;
  });

  it("task's index is out of tasks configuration boundaries, configuration is not updated", async () => {
    MockVSCodeInfo.configTasks?.set("wsFolder1", [
      new MockConfigTask("aaa", "test"),
    ]);
    const task1: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __index: 2,
      __intent: "Deploy",
      __wsFolder: "wsFolder1",
    };
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task1],
    };
    const item1 = new TaskTreeItem(
      2,
      "test",
      "aaa",
      "wsFolder1",
      TreeItemCollapsibleState.None,
      command1
    );

    await deleteTask(item1);
    expect(MockVSCodeInfo.saveCalled).false;
  });

  it("task contains command without arguments", async () => {
    MockVSCodeInfo.configTasks?.set("wsFolder1", [
      new MockConfigTask("aaa", "test"),
    ]);
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: undefined,
    };
    const item1 = new TaskTreeItem(
      0,
      "test",
      "aaa",
      "wsFolder1",
      TreeItemCollapsibleState.None,
      command1
    );

    await deleteTask(item1);
    expect(MockVSCodeInfo.configTasks?.get("wsFolder1")).to.not.empty;
  });

  it("item does not contain command", async () => {
    MockVSCodeInfo.configTasks?.set("wsFolder1", [
      new MockConfigTask("aaa", "test"),
    ]);
    const item1 = new TaskTreeItem(
      0,
      "test",
      "aaa",
      "wsFolder1",
      TreeItemCollapsibleState.None
    );

    await deleteTask(item1);
    expect(MockVSCodeInfo.configTasks?.get("wsFolder1")).to.not.empty;
  });
});
