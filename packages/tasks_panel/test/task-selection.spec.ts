import { expect } from "chai";
import { mockVscode, testVscode } from "./utils/mockVSCode";

mockVscode("/src/tasks-selection");
import { MockAppEvents } from "./utils/mockAppEvents";
import { MockContributorWithOnSave } from "./utils/mockContributor";
import { TasksSelection } from "../src/tasks-selection";
import { SinonMock, SinonSandbox, createSandbox } from "sinon";
import { cloneDeep, extend, map } from "lodash";
import * as taskProvider from "../src/services/tasks-provider";
import * as panelHandler from "../src/panels/panels-handler";
import * as multiStepSelection from "../src/multi-step-select";
import * as e2eConfig from "../src/misc/fiori-e2e-config";
// import { MockTaskTypeProvider } from "./utils/mockTaskTypeProvider";

const roots = ["/user/projects/project1", "/user/projects/project2"];

const taskContributed1 = {
  label: "Template: task1",
  type: "testType",
  prop1: "value1",
  taskType: "testIntent",
  __intent: "build",
  __wsFolder: roots[0],
  __extensionName: "testExtension",
};

const taskContributed2 = {
  label: "Template: task2",
  type: "extendedTestType",
  prop1: "value1",
  taskType: "testIntent",
  __intent: "intent-2",
  __wsFolder: roots[0],
  __extensionName: "testExtension",
};

const taskNotContributed = {
  label: "Template: task3",
  prop1: "value1",
  type: "otherType",
  taskType: "testIntent",
  __intent: "unknown",
  __wsFolder: roots[1],
  __extensionName: "testExtension",
};

const readFile = async function (): Promise<string> {
  return "aaa";
};

describe("the TasksSelection class", () => {
  let sandbox: SinonSandbox;
  let mockWindow: SinonMock;
  let mockPanelHandler: SinonMock;
  const tasks = [taskContributed1, taskContributed2, taskNotContributed];
  before(() => {
    sandbox = createSandbox();
  });

  const appEvents = new MockAppEvents();

  beforeEach(() => {
    mockWindow = sandbox.mock(testVscode.window);
    mockPanelHandler = sandbox.mock(panelHandler);
  });

  afterEach(() => {
    mockWindow.verify();
    mockPanelHandler.verify();
    sandbox.restore();
  });

  // const provider = new taskProvider.TasksProvider(new MockTaskTypeProvider());
  const taskSelection = new TasksSelection(appEvents, tasks, readFile);

  it("constructor", () => {
    expect(taskSelection["appEvents"]).to.be.equal(appEvents);
    expect(taskSelection["tasks"]).to.be.deep.equal(tasks);
    expect(taskSelection["readResource"]).to.be.equal(readFile);
  });

  // it("select - fiori E2E config item selected", async () => {
  //   const fioriE2e = {
  //     type: e2eConfig.TYPE_DEPLOY_CFG.fioriDeploymentConfig,
  //     wsFolder: "ws-folder",
  //     project: "my-project",
  //   };
  //   sandbox
  //     .stub(multiStepSelection, "multiStepTaskSelect")
  //     .withArgs(taskSelection["tasks"])
  //     .resolves({ task: fioriE2e });
  //   mockPanelHandler.expects("createTaskEditorPanel").never();
  //   const mockFioriE2EConfig = sandbox.mock(e2eConfig);
  //   mockFioriE2EConfig.expects("fioriE2eConfig").withExactArgs(fioriE2e.wsFolder, fioriE2e.project).resolves();
  //   await taskSelection.select();
  //   mockFioriE2EConfig.verify();
  // });

  it("select - task selected", async () => {
    sandbox.stub(taskProvider, "getConfiguredTasksFromCache").returns(tasks);
    sandbox
      .stub(multiStepSelection, "multiStepTaskSelect")
      .withArgs(taskSelection["tasks"])
      .resolves({ task: cloneDeep(taskContributed1) });
    const expectedTask = extend(cloneDeep(tasks[0]), {
      __index: 0,
      label: taskSelection["getUniqueTaskLabel"](tasks[0].label, map(tasks, "label")),
    });
    mockPanelHandler.expects("createTaskEditorPanel").withExactArgs(expectedTask, readFile).resolves();
    await taskSelection.select();
  });

  it("select - task selection canceled", async () => {
    sandbox.stub(multiStepSelection, "multiStepTaskSelect").withArgs(taskSelection["tasks"]).resolves({});
    mockPanelHandler.expects("createTaskEditorPanel").never();
    await taskSelection.select();
  });

  it("select - exception thrown", async () => {
    const error = new Error("canceled");
    sandbox.stub(multiStepSelection, "multiStepTaskSelect").withArgs(taskSelection["tasks"]).rejects(error);
    mockPanelHandler.expects("createTaskEditorPanel").never();
    mockWindow.expects("showErrorMessage").withExactArgs(error.toString());
    await taskSelection.select();
  });

  describe("getUniqueTaskLabel method", () => {
    const instance = new TasksSelection(new MockAppEvents(), tasks, readFile);

    it("returns input value if it's unique", () => {
      expect(instance["getUniqueTaskLabel"]("newTask", ["someLabel"])).to.eq("newTask");
    });

    it("returns input value with suffix (2) if it's not unique", () => {
      expect(instance["getUniqueTaskLabel"]("task 2", ["task 2"])).to.eq("task 2 (2)");
    });

    it("returns input value with suffix (2) if it's not unique and contains special characters", () => {
      expect(instance["getUniqueTaskLabel"]("task (1) /path", ["task (1) /path"])).to.eq("task (1) /path (2)");
    });

    it("returns input value with suffix (3) if 2 similar tasks found", () => {
      expect(instance["getUniqueTaskLabel"]("task 3", ["task 3", "task 3 (2)"])).to.eq("task 3 (3)");
    });

    it("returns input value looking similar to existing but having some prefix", () => {
      expect(instance["getUniqueTaskLabel"]("my task 3", ["task 3", "task 3 (2)"])).to.eq("my task 3");
    });

    it("returns input value looking similar to existing but having some suffix", () => {
      expect(instance["getUniqueTaskLabel"]("task 3 (2).", ["task 3", "task 3 (2)"])).to.eq("task 3 (2).");
    });

    it("returns input value with suffix (11) if similar task with suffix (10) found", () => {
      expect(instance["getUniqueTaskLabel"]("task 3", ["task 3", "task 3 (10)"])).to.eq("task 3 (11)");
    });
  });

  describe("the setSelectedTask method", () => {
    let instance: TasksSelection;
    beforeEach(async () => {
      sandbox.stub(taskProvider, "getConfiguredTasksFromCache").returns(tasks);
      instance = new TasksSelection(new MockAppEvents(), tasks, readFile);
    });

    afterEach(async () => {
      await panelHandler.disposeTaskEditorPanel();
    });

    it("adds task addition to configuration", async () => {
      await instance["setSelectedTask"](taskContributed1);
      expect((instance["appEvents"] as MockAppEvents).createCalled).to.be.true;
    });

    it("adds task addition to configuration, contributer with 'onSave'", async () => {
      await instance["setSelectedTask"](taskContributed2);
      expect(MockContributorWithOnSave.onSaveCalled).to.be.true;
      expect((instance["appEvents"] as MockAppEvents).createCalled).to.be.true;
    });

    it("adds task [not contibuted] addition to configuration", async () => {
      await instance["setSelectedTask"](taskNotContributed);
      expect((instance["appEvents"] as MockAppEvents).createCalled).to.be.true;
    });
  });
});
