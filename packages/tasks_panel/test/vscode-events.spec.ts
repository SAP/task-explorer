import { expect } from "chai";
import { MockConfigTask, mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "./utils/mockVSCode";

mockVscode("/src/vscode-events");
import { VSCodeEvents } from "../src/vscode-events";
import { messages } from "../src/i18n/messages";
import { MockTaskEditorContributer } from "../src/webSocketServer/server-events";
import { Contributors } from "../src/services/contributors";
import { MockTaskTypeProvider } from "./utils/mockTaskTypeProvider";

const task = {
  label: "task 1",
  name: "task 1",
  type: "testType",
  prop1: "value1",
  taskType: "testIntent",
  __index: 0,
  __intent: "testIntent",
  __wsFolder: "path",
  __extensionName: "testExtension",
};

describe("the VscodeEvents class", () => {
  afterEach(() => {
    resetTestVSCode();
  });

  describe("executeTask method", () => {
    it("selects the task from the list of fetched tasks and calls vscode execution task functionality", async () => {
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.allTasks = [new MockConfigTask("task 1", "test"), new MockConfigTask("task 2", "test")];
      MockVSCodeInfo.allTasks[0].name = MockVSCodeInfo.allTasks[0].label;
      MockVSCodeInfo.allTasks[1].name = MockVSCodeInfo.allTasks[1].label;
      await vscodeEvents.executeTask(task);
      expect(MockVSCodeInfo.taskParam!.label).eq("task 1");
      expect(MockVSCodeInfo.executeCalled).true;
    });
  });

  describe("updateTask method", () => {
    it("updates task in tasks configuration. `task 1` instead of `task two`", async () => {
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.configTasks = new Map<string, MockConfigTask[]>();
      MockVSCodeInfo.configTasks.set("path", [
        new MockConfigTask("task one", "test"),
        new MockConfigTask("task two", "test"),
      ]);
      await vscodeEvents.updateTaskInConfiguration("path", task, 1);
      expect(MockVSCodeInfo.configTasks.get("path")![0].label).eq("task one");
      expect(MockVSCodeInfo.configTasks.get("path")![1].label).eq("task 1");
    });

    it("logs error on try to update task with wrong index", async () => {
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.configTasks = new Map<string, MockConfigTask[]>();
      MockVSCodeInfo.configTasks.set("path", [new MockConfigTask("task one", "test")]);
      await vscodeEvents.updateTaskInConfiguration("path", task, 3);
      expect(MockVSCodeInfo.errorMsg).eq(messages.TASK_UPDATE_FAILED(3, 1));
    });

    it("logs error on try to update task of undefined configuration", async () => {
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.configTasks = undefined;
      await vscodeEvents.updateTaskInConfiguration("path", task, 1);
      expect(MockVSCodeInfo.errorMsg).eq(messages.TASK_UPDATE_FAILED(1, 0));
    });
  });

  describe("createTask method", () => {
    it("adds new task to the existing configuration and returns its index", async () => {
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.configTasks = new Map<string, MockConfigTask[]>();
      MockVSCodeInfo.configTasks.set("path", [
        new MockConfigTask("task one", "test"),
        new MockConfigTask("task two", "test"),
      ]);
      expect(await vscodeEvents.addTaskToConfiguration("path", task)).eq(2);
    });

    it("adds new task to the empty configuration and returns its index", async () => {
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.configTasks = undefined;
      expect(await vscodeEvents.addTaskToConfiguration("path", task)).eq(0);
    });
  });

  describe("getTaskPropertyDescription method", () => {
    it("returns property description provided by contributor API", async () => {
      const contributor = new MockTaskTypeProvider();
      Contributors["instance"] = contributor;
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      expect(await vscodeEvents.getTaskPropertyDescription("testType", "property")).eq("property");
    });
  });
});
