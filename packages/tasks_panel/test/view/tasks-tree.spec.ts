import { expect } from "chai";
import {
  mockVscode,
  MockVSCodeInfo,
  resetTestVSCode,
  testVscode,
} from "../utils/mockVSCode";

mockVscode("src/view/tasks-tree");
import { TasksTree } from "../../src/view/tasks-tree";
import { MockTasksProvider } from "../utils/mockTasksProvider";

const tasks = [
  { type: "type1", label: "task1", __intent: "deploy" },
  { type: "type2", label: "task2", __intent: "deploy" },
  { type: "type3", label: "task3", __intent: "build" },
  { type: "type3", label: "task4", __intent: "build" },
];

describe("TasksTree class", () => {
  afterEach(() => {
    resetTestVSCode();
  });

  it("getTreeItem method returns input item", () => {
    const taskProvider = new MockTasksProvider([]);
    const tree = new TasksTree(taskProvider);
    const item = new testVscode.TreeItem();
    expect(tree.getTreeItem(item)).eq(item);
  });

  it("onChange method fires tree refresh", () => {
    const taskProvider = new MockTasksProvider([]);
    const tree = new TasksTree(taskProvider);
    tree.onChange();
    expect(MockVSCodeInfo.fired).true;
  });

  describe("getChildren method", () => {
    it("Returns intents items when called with no arguments", async () => {
      const taskProvider = new MockTasksProvider(tasks);
      const tasksTree = new TasksTree(taskProvider);
      const items = await tasksTree.getChildren();
      expect(items.length).eq(2);
      expect(items[0].label).eq("deploy");
      expect(items[1].label).eq("build");
    });

    it("Returns tasks of specific intent when called with the intent item", async () => {
      const taskProvider = new MockTasksProvider(tasks);
      const tasksTree = new TasksTree(taskProvider);
      const rootItems = await tasksTree.getChildren();
      const items = await tasksTree.getChildren(rootItems[1]);
      expect(items.length).eq(2);
      expect(items[0].label).eq("task3");
      expect(items[1].label).eq("task4");
    });
  });

  describe("configuration change event", () => {
    it("onCreate callback fires tree refresh", () => {
      const taskProvider = new MockTasksProvider([]);
      new TasksTree(taskProvider);
      MockVSCodeInfo.onDidChangeConfigurationCallback();
      expect(MockVSCodeInfo.fired).true;
    });
  });
});
