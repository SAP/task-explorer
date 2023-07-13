import { expect } from "chai";
import { mockVscode } from "./utils/mockVSCode";

mockVscode("/src/tasks-selection");
import { TasksSelection } from "../src/tasks-selection";
import { MockRpc } from "./utils/mockRpc";
import { MockAppEvents } from "./utils/mockAppEvents";
import { disposeTaskEditorPanel } from "../src/panels/panels-handler";
import { messages } from "../src/i18n/messages";
import { MockContributorWithOnSave } from "./utils/mockContributor";

const taskContributed1 = {
  label: "Template: task1",
  type: "testType",
  prop1: "value1",
  taskType: "testIntent",
  __intent: "testIntent",
  __wsFolder: "path",
  __extensionName: "testExtension",
};

const taskContributed2 = {
  label: "Template: task2",
  type: "extendedTestType",
  prop1: "value1",
  taskType: "testIntent",
  __intent: "testIntent",
  __wsFolder: "path",
  __extensionName: "testExtension",
};

const taskNotContributed = {
  label: "Template: bbb",
  prop1: "value1",
  type: "otherType",
  taskType: "testIntent",
  __intent: "unknown",
  __wsFolder: "path",
  __extensionName: "testExtension",
};

const readFile = async function (): Promise<string> {
  return "aaa";
};

describe("the TasksSelection class", () => {
  describe("the onFrontendReady method", () => {
    it("passes expected array of tasks to frontend and expected empty message", async () => {
      const rpc = new MockRpc();
      const appEvents = new MockAppEvents();
      const tasksSelection = new TasksSelection(
        rpc,
        appEvents,
        [taskContributed1, taskContributed2, taskNotContributed],
        readFile
      );
      await tasksSelection["onFrontendReady"]();
      expect(rpc.invokedMethod).to.eq("setTasks");
      expect(rpc.params.length).to.eq(2);
      expect(rpc.params[0].length).to.eq(1);
      expect(rpc.params[0][0].intent).to.eq("testIntent");
      expect(rpc.params[0][0].tasksByIntent.length).to.eq(2);
      expect(rpc.params[0][0].tasksByIntent[0].label).to.eq("task1");
      expect(rpc.params[0][0].tasksByIntent[1].label).to.eq("task2");
      expect(rpc.params[1]).to.be.empty;
    });

    it("passes empty array of tasks to frontend and message about missing tasks", async () => {
      const rpc = new MockRpc();
      const appEvents = new MockAppEvents();
      const tasksSelection = new TasksSelection(rpc, appEvents, [], readFile);
      await tasksSelection["onFrontendReady"]();
      expect(rpc.invokedMethod).to.eq("setTasks");
      expect(rpc.params.length).to.eq(2);
      expect(rpc.params[0].length).to.eq(0);
      expect(rpc.params[1]).to.eq(messages.MISSING_AUTO_DETECTED_TASKS());
    });
  });

  describe("the setSelectedTask method", () => {
    const readFile = async function (): Promise<string> {
      return "aaa";
    };

    afterEach(async () => {
      await disposeTaskEditorPanel();
    });

    it("adds task addition to configuration", async () => {
      const rpc = new MockRpc();
      const appEvents = new MockAppEvents();
      const tasksSelection = new TasksSelection(rpc, appEvents, [taskContributed1, taskNotContributed], readFile);
      await tasksSelection["setSelectedTask"](taskContributed1);
      expect(appEvents.createCalled).to.be.true;
    });

    it("adds task addition to configuration, contributer with 'onSave'", async () => {
      const rpc = new MockRpc();
      const appEvents = new MockAppEvents();
      const tasksSelection = new TasksSelection(rpc, appEvents, [taskContributed2, taskNotContributed], readFile);
      await tasksSelection["setSelectedTask"](taskContributed2);
      expect(MockContributorWithOnSave.onSaveCalled).to.be.true;
      expect(appEvents.createCalled).to.be.true;
    });

    it("adds task [not contibuted] addition to configuration", async () => {
      const rpc = new MockRpc();
      const appEvents = new MockAppEvents();
      const tasksSelection = new TasksSelection(rpc, appEvents, [taskContributed2, taskNotContributed], readFile);
      await tasksSelection["setSelectedTask"](taskNotContributed);
      expect(appEvents.createCalled).to.be.true;
    });
  });

  describe("getTaskImage method", () => {
    it("returns image when contributor defined", () => {
      const rpc = new MockRpc();
      const appEvents = new MockAppEvents();
      const tasksSelection = new TasksSelection(rpc, appEvents, [taskContributed1], readFile);
      expect(tasksSelection["getTaskImage"]("testType")).to.eq("image");
    });

    it("returns empty string when contributor is not defined", () => {
      const rpc = new MockRpc();
      const appEvents = new MockAppEvents();
      const tasksSelection = new TasksSelection(rpc, appEvents, [taskContributed1], readFile);
      expect(tasksSelection["getTaskImage"]("unknown")).to.eq("");
    });
  });

  describe("getUniqueTaskLabel method", () => {
    let tasksSelection: TasksSelection;

    before(async () => {
      const rpc = new MockRpc();
      const appEvents = new MockAppEvents();
      const task = {
        label: "task 1",
        type: "testType",
        prop1: "value1",
        __index: 0,
        __intent: "testIntent",
        __wsFolder: "path",
        __extensionName: "testExtension",
      };
      tasksSelection = new TasksSelection(rpc, appEvents, [task], readFile);
    });

    it("returns input value if it's unique", () => {
      expect(tasksSelection["getUniqueTaskLabel"]("newTask", ["someLabel"])).to.eq("newTask");
    });

    it("returns input value with suffix (2) if it's not unique", () => {
      expect(tasksSelection["getUniqueTaskLabel"]("task 2", ["task 2"])).to.eq("task 2 (2)");
    });

    it("returns input value with suffix (2) if it's not unique and contains special characters", () => {
      expect(tasksSelection["getUniqueTaskLabel"]("task (1) /path", ["task (1) /path"])).to.eq("task (1) /path (2)");
    });

    it("returns input value with suffix (3) if 2 similar tasks found", () => {
      expect(tasksSelection["getUniqueTaskLabel"]("task 3", ["task 3", "task 3 (2)"])).to.eq("task 3 (3)");
    });

    it("returns input value looking similar to existing but having some prefix", () => {
      expect(tasksSelection["getUniqueTaskLabel"]("my task 3", ["task 3", "task 3 (2)"])).to.eq("my task 3");
    });

    it("returns input value looking similar to existing but having some suffix", () => {
      expect(tasksSelection["getUniqueTaskLabel"]("task 3 (2).", ["task 3", "task 3 (2)"])).to.eq("task 3 (2).");
    });

    it("returns input value with suffix (11) if similar task with suffix (10) found", () => {
      expect(tasksSelection["getUniqueTaskLabel"]("task 3", ["task 3", "task 3 (10)"])).to.eq("task 3 (11)");
    });
  });
});
