/* eslint-disable eslint-comments/disable-enable-pair -- disable the next rule */
/* eslint-disable @typescript-eslint/no-unused-vars -- leave unused args in function signatures as a reference */
import { expect } from "chai";
import { ConfiguredTask, FormProperty, TaskEditorContributionAPI } from "@sap_oss/task_contrib_types";
import { MockConfigTask, mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "../utils/mockVSCode";

mockVscode("src/services/tasks-provider");
import { TasksProvider } from "../../src/services/tasks-provider";
import { IContributors, ITasksEventHandler, ITaskTypeEventHandler } from "../../src/services/definitions";

describe("the TasksProvider class", () => {
  afterEach(
    () =>
      function () {
        resetTestVSCode();
      }
  );

  describe("getTaskWorkspaceFolder method", () => {
    it("returns `undefined` for task with scope different from WorkspaceFolder", () => {
      const task = new testVscode.Task({ label: "aaa" }, undefined, testVscode.TaskScope.Global);
      expect(TasksProvider["getTaskWorkspaceFolder"](task)).undefined;
    });

    it("returns path for task with WorkspaceFolder scope", () => {
      const task = new testVscode.Task({ label: "aaa" }, undefined, {
        uri: { path: "path" },
      });
      expect(TasksProvider["getTaskWorkspaceFolder"](task)).eq("path");
    });
  });

  describe("registered event handler is called when onChange method is called", () => {
    it("sanity", () => {
      const taskTypesProvider = new MockTaskTypeProvider();
      const taskProvider = new TasksProvider(taskTypesProvider);
      const tasksEventHandler = new MockTasksEventHandler();
      taskProvider.registerEventHandler(tasksEventHandler);
      taskProvider.onChange();
      expect(tasksEventHandler.changed).true;
    });
  });

  describe("method getConfiguredTasks", () => {
    afterEach(() => {
      resetTestVSCode();
    });

    it("returns empty result, when workspace folders are undefined", async () => {
      const taskTypesProvider = new MockTaskTypeProvider();
      const taskProvider = new TasksProvider(taskTypesProvider);
      testVscode.workspace.workspaceFolders = undefined;
      const tasks = await taskProvider.getConfiguredTasks();
      expect(tasks.length).eq(0);
    });

    it("returns configured task when it exists in workspace folder", async () => {
      const taskTypesProvider = new MockTaskTypeProvider();
      const taskProvider = new TasksProvider(taskTypesProvider);
      testVscode.workspace.workspaceFolders = [{ uri: { path: "path" } }];
      MockVSCodeInfo.configTasks?.set("path", [new MockConfigTask("task1", "type1")]);
      const tasks = await taskProvider.getConfiguredTasks();
      expect(tasks.length).eq(1);
      expect(tasks[0].__index).eq(0);
      expect(tasks[0].__intent).eq("abc");
    });

    it("returns empty result, when tasks configuration does not exist in defined workspace folder", async () => {
      const taskTypesProvider = new MockTaskTypeProvider();
      const taskProvider = new TasksProvider(taskTypesProvider);
      testVscode.workspace.workspaceFolders = [{ uri: { path: "path1" } }];
      MockVSCodeInfo.configTasks?.set("path2", [new MockConfigTask("task1", "type1")]);
      const tasks = await taskProvider.getConfiguredTasks();
      expect(tasks.length).eq(0);
    });
  });

  describe("method getAutodectedTasks", () => {
    // VSCode fetches tasks with proper task & task type; this test mocks tasks in a way they are fetched in VSCode
    it("returns one autodetected task, fetching 2 tasks, one of which relates to configured tasks; imitates VSCode environment", async () => {
      const taskTypesProvider = new MockTaskTypeProvider();
      const taskProvider = new TasksProvider(taskTypesProvider);
      testVscode.workspace.workspaceFolders = [{ uri: { path: "path1" } }];
      MockVSCodeInfo.allTasks = [
        new testVscode.Task({
          label: "task1",
          type: "type1",
          taskType: "taskType",
        }),
        new testVscode.Task({ label: "task2", type: "type1", taskType: "taskType" }, "Workspace"),
      ];
      const tasks = await taskProvider.getAutoDectedTasks();
      expect(tasks.length).eq(1);
    });

    // VSCode fetches tasks with proper task & task type; this test mocks tasks in a way they are fetched in Theia
    it("returns one autodetected task, fetching 2 tasks, one of which relates to configured tasks; imitates Theia environment", async () => {
      const taskTypesProvider = new MockTaskTypeProvider();
      const taskProvider = new TasksProvider(taskTypesProvider);
      testVscode.workspace.workspaceFolders = [{ uri: { path: "path1" } }];
      MockVSCodeInfo.allTasks = [
        new testVscode.Task({
          label: "task1",
          type: "shell",
          taskType: "type1",
        }),
        new testVscode.Task({ label: "task2", type: "type1", taskType: "taskType" }, "Workspace"),
      ];
      const tasks = await taskProvider.getAutoDectedTasks();
      expect(tasks.length).eq(1);
    });
  });
});

class MockTaskEditorContribution implements TaskEditorContributionAPI<ConfiguredTask> {
  updateTask(task: ConfiguredTask, changes: any): ConfiguredTask {
    return task;
  }

  convertTaskToFormProperties(task: ConfiguredTask): FormProperty[] {
    return [];
  }

  getTaskImage(): string {
    return "";
  }

  async init(wsFolder: string, task: ConfiguredTask): Promise<void> {
    return;
  }
}

class MockTaskTypeProvider implements IContributors {
  getIntentByType(type: string): string {
    return "abc";
  }

  getExtensionNameByType(type: string): string {
    return "testextension";
  }

  getSupportedIntents(): string[] {
    return ["abc"];
  }

  getSupportedTypes(): string[] {
    return ["type1"];
  }

  getTaskEditorContributor(type: string): TaskEditorContributionAPI<ConfiguredTask> {
    return new MockTaskEditorContribution();
  }

  async init(): Promise<void> {
    return;
  }

  registerEventHandler(eventHandler: ITaskTypeEventHandler): void {
    return;
  }

  getTaskPropertyDescription(type: string, property: string): string {
    return property;
  }
}

class MockTasksEventHandler implements ITasksEventHandler {
  public changed = false;

  async onChange(): Promise<void> {
    this.changed = true;
  }
}
