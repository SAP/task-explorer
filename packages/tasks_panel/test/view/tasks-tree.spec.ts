import { expect } from "chai";
import { mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "../utils/mockVSCode";

mockVscode("src/view/tasks-tree");
import { TasksTree } from "../../src/view/tasks-tree";
import { MockTasksProvider } from "../utils/mockTasksProvider";
import { cloneDeep, find, reduce } from "lodash";
import { createSandbox, SinonSandbox } from "sinon";
import { EmptyTaskTreeItem, IntentTreeItem, ProjectTreeItem } from "../../src/view/task-tree-item";

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
      testVscode.workspace.workspaceFolders = [
        { uri: { fsPath: tasks[0].__wsFolder } },
        { uri: { fsPath: tasks[1].__wsFolder } },
      ];
      const taskProvider = new MockTasksProvider(tasks);
      const tasksTree = new TasksTree(taskProvider);
      const items = await tasksTree.getChildren();
      expect(items.length).eq(2);
      expect((<any>find(items, ["label", tasks[0].__wsFolder])).fqn).to.be.equal(tasks[0].__wsFolder);
      expect((<any>find(items, ["label", tasks[1].__wsFolder])).fqn).to.be.equal(tasks[1].__wsFolder);
    });

    it("Returns a root project item when called with no arguments (single root)", async () => {
      const wsFolder = "/root/test/proj";
      testVscode.workspace.workspaceFolders = [{ uri: { fsPath: wsFolder } }];
      const copyTasks = reduce(
        tasks,
        (acc, _) => {
          const task = cloneDeep(_);
          task.__wsFolder = wsFolder;
          acc.push(task);
          return acc;
        },
        [] as any[],
      );
      const taskProvider = new MockTasksProvider(copyTasks);
      const tasksTree = new TasksTree(taskProvider);
      const items = await tasksTree.getChildren();
      expect(items).to.be.lengthOf(1);
      expect(items[0]).to.be.an.instanceof(ProjectTreeItem);
      expect(items[0].label).to.equal(wsFolder);
    });

    it("Returns tasks of specific intent when called with the intent item", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { fsPath: tasks[0].__wsFolder } },
        { uri: { fsPath: tasks[1].__wsFolder } },
      ];
      const taskProvider = new MockTasksProvider(tasks);
      const tasksTree = new TasksTree(taskProvider);
      const rootItems = await tasksTree.getChildren();
      const intents = await tasksTree.getChildren(find(rootItems, ["label", tasks[2].__wsFolder]));
      expect(intents).to.be.lengthOf(2);
      let taskByIntent = await tasksTree.getChildren(intents[0]);
      expect(taskByIntent).to.be.lengthOf(1);
      expect(taskByIntent[0].label).eq("task3");
      taskByIntent = await tasksTree.getChildren(intents[1]);
      expect(taskByIntent).to.be.lengthOf(1);
      expect(taskByIntent[0].label).eq("task2");
    });

    it("Broken tree structure - intent label missing", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { fsPath: tasks[0].__wsFolder } }];
      const tasksTree = new TasksTree(new MockTasksProvider(tasks));
      const rootItems = await tasksTree.getChildren();
      const item = rootItems[0];
      delete (item as any).fqn;
      const children = await tasksTree.getChildren(item);
      expect(children).to.be.lengthOf(1);
      expect(children[0]).to.be.instanceOf(EmptyTaskTreeItem);
    });

    it("create roots items, when workspace folder incorrect", async () => {
      sandbox.stub(testVscode.workspace, "getWorkspaceFolder").returns(undefined);
      const tasksTree = new TasksTree(new MockTasksProvider(tasks));
      const items = await tasksTree.getChildren();
      expect(items).to.be.empty;
    });

    it("create roots items, when workspace structure broken", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { fsPath: "/other/root/folder" } }];
      const taskChildren = await new TasksTree(new MockTasksProvider(tasks)).getChildren(
        new IntentTreeItem("some", testVscode.TreeItemCollapsibleState.Expanded),
      );
      expect(taskChildren).to.be.empty;
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

  describe("findTreeItem", () => {
    it("findTreeItem - element found", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { fsPath: tasks[0].__wsFolder } },
        { uri: { fsPath: tasks[1].__wsFolder } },
      ];
      const tasksTree = new TasksTree(new MockTasksProvider(tasks));
      const i = await tasksTree.findTreeItem(tasks[3]);
      expect(i?.command?.arguments?.[0]).to.equal(tasks[3]);
    });

    it("findTreeItem - element not exists", async () => {
      testVscode.workspace.workspaceFolders = [
        { uri: { fsPath: tasks[0].__wsFolder } },
        { uri: { fsPath: tasks[1].__wsFolder } },
      ];
      const tasksTree = new TasksTree(new MockTasksProvider(tasks));
      expect(await tasksTree.findTreeItem({ type: "type3", label: "unknown" })).to.be.undefined;
    });
  });
});
