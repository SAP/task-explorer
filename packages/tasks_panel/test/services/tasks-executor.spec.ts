import { expect } from "chai";
import { mockVscode, MockVSCodeInfo, resetTestVSCode } from "../utils/mockVSCode";
mockVscode("src/services/tasks-executor");
import { executeVScodeTask } from "../../src/services/tasks-executor";

describe("tasks executor - executeVScodeTask", () => {
  afterEach(() => {
    resetTestVSCode();
  });

  it("executed task is among fetched tasks -> executeTask is called", async () => {
    const myTask = { label: "aaa" };
    MockVSCodeInfo.allTasks = [{ name: "aaa", label: "aaa" }];
    await executeVScodeTask(myTask);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppress rule for test scope
    expect(MockVSCodeInfo.taskParam!.label).eq("aaa");
    expect(MockVSCodeInfo.executeCalled).true;
  });

  it("executed task is configured npm tasks -> executeTask is called", async () => {
    const myTask = {
      label: "install -- proj 1",
      type: "npm",
      script: "script",
      path: "proj 1",
      __wsFolder: "/my/path",
    };
    MockVSCodeInfo.allTasks = [
      { name: "aaa", label: "aaa", definition: {} },
      { name: "install", definition: { script: "script", path: "proj 1" }, scope: "/my/path" },
      { name: "install", definition: { script: "script", path: "proj 1" }, scope: { uri: { path: "/my/path" } } },
    ];
    await executeVScodeTask(myTask);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppress rule for test scope
    expect(MockVSCodeInfo.taskParam?.name).eq(myTask.label);
    expect(MockVSCodeInfo.executeCalled).true;
    // await for fake execution end in 100 msec
    await new Promise((resolve) => setTimeout(() => resolve(true), 500));
  });

  it("the executed task is not among the fetched tasks -> executeTask is not called ", async () => {
    const myTask = { label: "ccc" };
    MockVSCodeInfo.allTasks = [{ name: "aaa" }];
    await executeVScodeTask(myTask);
    expect(MockVSCodeInfo.executeCalled).false;
  });

  it("error is thrown during execution -> error message is shown", async () => {
    const myTask = { label: "aaa" };
    MockVSCodeInfo.allTasks = [{ name: "aaa" }];
    MockVSCodeInfo.fail = true;
    await executeVScodeTask(myTask);
    expect(MockVSCodeInfo.executeCalled).true;
    expect(MockVSCodeInfo.errorMsg).eq("test");
  });
});
