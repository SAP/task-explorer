/* eslint-disable eslint-comments/disable-enable-pair -- suppress for tests scope */
/* eslint-disable @typescript-eslint/no-non-null-assertion -- suppress for test scope */
/* eslint-disable @typescript-eslint/no-unused-vars -- leave unsused arg for reference in test scope */
import { expect } from "chai";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { createSandbox } from "sinon";

import { MockConfigTask, mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "../utils/mockVSCode";
import { MockTasksProvider } from "../utils/mockTasksProvider";

mockVscode("../../src/panels/task-editor-panel");
import { editTask, editTreeItemTask } from "../../src/commands/edit-task";
import { IntentTreeItem, TaskTreeItem } from "../../src/view/task-tree-item";
import { TreeItemCollapsibleState } from "vscode";
import { cloneDeep, extend } from "lodash";
import { disposeTaskEditorPanel, getTaskEditor, getTaskEditorPanel } from "../../src/panels/panels-handler";
import { createLoggerWrapperMock, getLoggerMessage, resetLoggerMessage } from "../utils/loggerWrapperMock";
import { messages } from "../../src/i18n/messages";
import { serializeTask } from "../../src/utils/task-serializer";

describe("Command editTask", () => {
  const readFile = async function (path: string): Promise<string> {
    return "aaa";
  };

  const tasks = [
    {
      label: "task 1",
      type: "testType",
      taskType: "Deploy",
      prop1: "value 1.1",
    },
  ];

  const mockTaskProvider = new MockTasksProvider(tasks);
  let sandbox: any;
  let loggerWrapperMock: any;

  beforeEach(() => {
    sandbox = createSandbox();
    loggerWrapperMock = createLoggerWrapperMock(sandbox);
  });

  afterEach(() => {
    sandbox.restore();
    resetLoggerMessage();
    disposeTaskEditorPanel();
    resetTestVSCode();
  });

  const parentItem = new IntentTreeItem("dummy", testVscode.TreeItemCollapsibleState.None);

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
    const item1 = new TaskTreeItem(0, "test", "aaa", "path", TreeItemCollapsibleState.None, parentItem, command1);
    await editTreeItemTask(mockTaskProvider, readFile, item1);
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
    const item2 = new TaskTreeItem(0, "test", "bbb", "path", TreeItemCollapsibleState.None, parentItem, command2);
    await editTreeItemTask(mockTaskProvider, readFile, item2);
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
    const item1 = new TaskTreeItem(0, "test", "aaa", "path", TreeItemCollapsibleState.None, parentItem, command1);
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
    const item2 = new TaskTreeItem(0, "test", "bbb", "path", TreeItemCollapsibleState.None, parentItem, command2);
    await editTreeItemTask(mockTaskProvider, readFile, item1);
    expect(MockVSCodeInfo.webViewCreated).eq(1);
    await editTreeItemTask(mockTaskProvider, readFile, item2);
    expect(MockVSCodeInfo.webViewCreated).eq(2);
  });

  it("item misses command with task; view is not created", async () => {
    const item = new TaskTreeItem(0, "test", "bbb", "path", TreeItemCollapsibleState.None, parentItem);
    await editTreeItemTask(mockTaskProvider, readFile, item);
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
    const item1 = new TaskTreeItem(0, "test", "aaa", "path", TreeItemCollapsibleState.None, parentItem, command1);
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
    const item2 = new TaskTreeItem(0, "test", "bbb", "path", TreeItemCollapsibleState.None, parentItem, command2);
    await editTreeItemTask(mockTaskProvider, readFile, item1);
    const taskEditor = getTaskEditor();
    taskEditor!["rpc"]["invoke"] = invokeMock;
    taskEditor!["setAnswers"]({ answers: { label: "aa1" } });
    MockVSCodeInfo.dialogAnswer = "Discard Changes";
    await editTreeItemTask(mockTaskProvider, readFile, item2);
    expect(MockVSCodeInfo.updateCalled).to.be.undefined;
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
    const item1 = new TaskTreeItem(0, "test", "aaa", "path", TreeItemCollapsibleState.None, parentItem, command1);
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
    const item2 = new TaskTreeItem(0, "test", "bbb", "path", TreeItemCollapsibleState.None, parentItem, command2);
    await editTreeItemTask(mockTaskProvider, readFile, item1);
    const taskEditor = getTaskEditor();
    taskEditor!["rpc"]["invoke"] = invokeMock;
    taskEditor?.["setAnswers"]({ answers: { label: "aa1" } });
    MockVSCodeInfo.dialogAnswer = "No";
    await editTreeItemTask(mockTaskProvider, readFile, item2);
    expect(MockVSCodeInfo.updateCalled).to.be.undefined;
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
    const item1 = new TaskTreeItem(0, "test", "aaa", "wsFolder1", TreeItemCollapsibleState.None, parentItem, command1);

    await editTreeItemTask(mockTaskProvider, readFile, item1);
    expect(MockVSCodeInfo.configTasks?.get("wsFolder1")).to.not.empty;
  });

  describe("edit command programmatically", () => {
    const item = new TaskTreeItem(0, "test", "aaa", "path", TreeItemCollapsibleState.None, parentItem);

    it("edit command - task found", async () => {
      const task: ConfiguredTask = cloneDeep(tasks[0]);
      item.command = {
        title: "Edit Task",
        command: "tasks-explorer.editTask",
        arguments: [task],
      };
      await editTreeItemTask(mockTaskProvider, readFile, item);
      expect(MockVSCodeInfo.webViewCreated).eq(1);
    });

    it("edit command - task not found", async () => {
      const task: ConfiguredTask = extend(cloneDeep(tasks[0]), { prop1: "value 1.2" });
      item.command = {
        title: "Edit Task",
        command: "tasks-explorer.editTask",
        arguments: [task],
      };
      await editTreeItemTask(mockTaskProvider, readFile, item);
      expect(MockVSCodeInfo.webViewCreated).eq(0);
      expect(getLoggerMessage()).to.be.equal(messages.EDIT_TASK_NOT_FOUND(serializeTask(task)));
    });
  });
});

async function invokeMock(method: string, params?: any): Promise<any> {
  return;
}
