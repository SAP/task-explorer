import { expect } from "chai";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";

import { MockConfigTask, mockVscode, MockVSCodeInfo, resetTestVSCode } from "../utils/mockVSCode";

mockVscode("../../src/panels/task-editor-panel");
import { editTask, editTreeItemTask } from "../../src/commands/edit-task";
import { TaskTreeItem } from "../../src/view/task-tree-item";
import { TreeItemCollapsibleState } from "vscode";
import { disposeTaskEditorPanel, getTaskEditor, getTaskEditorPanel } from "../../src/panels/panels-handler";

describe("Command editTask", () => {
  const readFile = async function (path: string): Promise<string> {
    return "aaa";
  };

  afterEach(() => {
    disposeTaskEditorPanel();
    resetTestVSCode();
  });

  it("task already opened for editing, not changed, new panel will be opened", async () => {
    const task1: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __intent: "Deploy",
    };
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task1],
    };
    const item1 = new TaskTreeItem(0, "test", "aaa", "path", TreeItemCollapsibleState.None, command1);
    await editTreeItemTask(readFile, item1);
    const task2: ConfiguredTask = {
      type: "test",
      label: "bbb",
      __intent: "Deploy",
    };
    const command2 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task2],
    };
    const item2 = new TaskTreeItem(0, "test", "bbb", "path", TreeItemCollapsibleState.None, command2);
    await editTreeItemTask(readFile, item2);
    expect(MockVSCodeInfo.webViewCreated).eq(2);
  });

  it("task `aaa` opened for editing but not changed; we ask to edit task `bbb`, editor of task `aaa` is disposed and task `bbb` is opened for editing", async () => {
    const task1: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __intent: "Deploy",
    };
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task1],
    };
    const item1 = new TaskTreeItem(0, "test", "aaa", "path", TreeItemCollapsibleState.None, command1);
    const task2: ConfiguredTask = {
      type: "test",
      label: "bbb",
      __intent: "Deploy",
    };
    const command2 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task2],
    };
    const item2 = new TaskTreeItem(0, "test", "bbb", "path", TreeItemCollapsibleState.None, command2);
    await editTreeItemTask(readFile, item1);
    expect(MockVSCodeInfo.webViewCreated).eq(1);
    await editTreeItemTask(readFile, item2);
    expect(MockVSCodeInfo.webViewCreated).eq(2);
  });

  it("item misses command with task; view is not created", async () => {
    const item = new TaskTreeItem(0, "test", "bbb", "path", TreeItemCollapsibleState.None);
    await editTreeItemTask(readFile, item);
    expect(MockVSCodeInfo.webViewCreated).eq(0);
  });

  it("task `aaa` opened for editing and changed; we try to edit task `bbb` and answer `Discard Changes` in the dialog; task `aaa` is closed and task `bbb` is opened for editing", async () => {
    MockVSCodeInfo.configTasks?.set("path", [new MockConfigTask("task1", "test"), new MockConfigTask("bbb", "test")]);
    const task1: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __intent: "Deploy",
    };
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task1],
    };
    const item1 = new TaskTreeItem(0, "test", "aaa", "path", TreeItemCollapsibleState.None, command1);
    const task2: ConfiguredTask = {
      type: "test",
      label: "bbb",
      __intent: "Deploy",
    };
    const command2 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task2],
    };
    const item2 = new TaskTreeItem(0, "test", "bbb", "path", TreeItemCollapsibleState.None, command2);
    await editTreeItemTask(readFile, item1);
    const taskEditor = getTaskEditor();
    taskEditor!["rpc"]["invoke"] = invokeMock;
    taskEditor!["setAnswers"]({ answers: { label: "aa1" } });
    MockVSCodeInfo.dialogAnswer = "Discard Changes";
    await editTreeItemTask(readFile, item2);
    expect(MockVSCodeInfo.saveCalled).false;
    expect(MockVSCodeInfo.webViewCreated).eq(2);
  });

  it("task `aaa` opened for editing and changed; we try to edit task `bbb` and answer `No` in the dialog; we continue to edit task `aaa`", async () => {
    MockVSCodeInfo.configTasks?.set("path", [new MockConfigTask("aaa", "test"), new MockConfigTask("bbb", "test")]);
    const task1: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __intent: "Deploy",
    };
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task1],
    };
    const item1 = new TaskTreeItem(0, "test", "aaa", "path", TreeItemCollapsibleState.None, command1);
    const task2: ConfiguredTask = {
      type: "test",
      label: "bbb",
      __intent: "Deploy",
    };
    const command2 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task2],
    };
    const item2 = new TaskTreeItem(0, "test", "bbb", "path", TreeItemCollapsibleState.None, command2);
    await editTreeItemTask(readFile, item1);
    const taskEditor = getTaskEditor();
    taskEditor!["rpc"]["invoke"] = invokeMock;
    taskEditor?.["setAnswers"]({ answers: { label: "aa1" } });
    MockVSCodeInfo.dialogAnswer = "No";
    await editTreeItemTask(readFile, item2);
    expect(MockVSCodeInfo.saveCalled).false;
    expect(MockVSCodeInfo.webViewCreated).eq(1);
  });

  it("task `aaa` opened for editing and changed; we try to edit task `aaa` again; new view is not opened and we continue with an old one", async () => {
    MockVSCodeInfo.configTasks?.set("path", [new MockConfigTask("aaa", "test"), new MockConfigTask("bbb", "test")]);
    const task1: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __intent: "Deploy",
      __wsFolder: { path: "path" },
      __index: 0,
    };
    const task2: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __intent: "Deploy",
      __wsFolder: { path: "path" },
      __index: 1,
    };
    await editTask(task1, readFile);
    expect(MockVSCodeInfo.webViewCreated).eq(1);
    const taskEditor = getTaskEditor();
    taskEditor!["rpc"]["invoke"] = invokeMock;
    taskEditor?.["setAnswers"]({ answers: { label: "aa1" } });
    MockVSCodeInfo.dialogAnswer = "cancel";
    await editTask(task2, readFile);
    expect(MockVSCodeInfo.webViewCreated).eq(1);
  });

  it("task not changed, no dialog happens", async () => {
    MockVSCodeInfo.configTasks?.set("path", [new MockConfigTask("aaa", "test"), new MockConfigTask("bbb", "test")]);
    const task1: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __intent: "Deploy",
      __wsFolder: { path: "path" },
      __index: 0,
    };
    await editTask(task1, readFile);
    const panel = getTaskEditorPanel();
    await panel?.dispose();
    expect(MockVSCodeInfo.disposeCalled).true;
    expect(MockVSCodeInfo.dialogCalled).false;
  });

  it("task contains command without arguments", async () => {
    MockVSCodeInfo.configTasks?.set("wsFolder1", [new MockConfigTask("aaa", "test")]);
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: undefined,
    };
    const item1 = new TaskTreeItem(0, "test", "aaa", "wsFolder1", TreeItemCollapsibleState.None, command1);

    await editTreeItemTask(readFile, item1);
    expect(MockVSCodeInfo.configTasks?.get("wsFolder1")).to.not.empty;
  });
});

async function invokeMock(method: string, params?: any): Promise<any> {
  return;
}
