import { expect } from "chai";
import { mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "../utils/mockVSCode";

mockVscode("src/view/tasks-tree");
import { TasksTree } from "../../src/view/tasks-tree";
import { MockTasksProvider } from "../utils/mockTasksProvider";
import { cloneDeep, find, reduce } from "lodash";
import { createSandbox, SinonSandbox } from "sinon";

const tasks = [
  { type: "type1", label: "task1", __intent: "deploy", __wsFolder: "/my/project1" },
  { type: "type2", label: "task2", __intent: "deploy", __wsFolder: "/my/project2" },
  { type: "type3", label: "task3", __intent: "build", __wsFolder: "/my/project2" },
  { type: "type3", label: "task4", __intent: "build", __wsFolder: "/my/project1" },
];

describe("TasksTree class", () => {
  let sandbox: SinonSandbox;

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    resetTestVSCode();
    sandbox.restore();
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
      expect((<any>find(items, ["label", tasks[0].__wsFolder])).fqn).to.be.equal(tasks[0].__wsFolder);
      expect((<any>find(items, ["label", tasks[1].__wsFolder])).fqn).to.be.equal(tasks[1].__wsFolder);
    });

    it("Returns intents items when called with no arguments (single root)", async () => {
      const wsFolder = "/root/test/proj";
      const copyTasks = reduce(
        tasks,
        (acc, _) => {
          const task = cloneDeep(_);
          task.__wsFolder = wsFolder;
          acc.push(task);
          return acc;
        },
        [] as any[]
      );
      const taskProvider = new MockTasksProvider(copyTasks);
      const tasksTree = new TasksTree(taskProvider);
      const items = await tasksTree.getChildren();
      expect(items.length).eq(2);
      expect(find(items, ["label", copyTasks[0].__intent])).to.be.exist;
      expect(find(items, ["label", copyTasks[3].__intent])).to.be.exist;
    });

    it("Returns tasks of specific intent when called with the intent item", async () => {
      const taskProvider = new MockTasksProvider(tasks);
      const tasksTree = new TasksTree(taskProvider);
      const rootItems = await tasksTree.getChildren();
      const intents = await tasksTree.getChildren(find(rootItems, ["label", tasks[2].__wsFolder]));
      expect(intents.length).eq(2);
      let taskByIntent = await tasksTree.getChildren(intents[0]);
      expect(taskByIntent.length).eq(1);
      expect(taskByIntent[0].label).eq("task3");
      taskByIntent = await tasksTree.getChildren(intents[1]);
      expect(taskByIntent.length).eq(1);
      expect(taskByIntent[0].label).eq("task2");
    });

    it("Broken tree structure - intent label missing", async () => {
      const tasksTree = new TasksTree(new MockTasksProvider(tasks));
      const rootItems = await tasksTree.getChildren();
      const item = rootItems[1];
      delete (item as any).fqn;
      expect((await tasksTree.getChildren(item)).length).to.eq(0);
    });

    it("create roots items, when workspace folder incorrect", async () => {
      sandbox.stub(testVscode.workspace, "getWorkspaceFolder").returns(undefined);
      const taskProvider = new MockTasksProvider(tasks);
      const tasksTree = new TasksTree(taskProvider);
      const items = await tasksTree.getChildren();
      expect(items.length).eq(2);
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
