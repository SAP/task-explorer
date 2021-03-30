import { expect } from "chai";
import {
  mockVscode,
  MockVSCodeInfo,
  resetTestVSCode,
} from "../utils/mockVSCode";
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
    expect(MockVSCodeInfo.taskParam!.label).eq("aaa");
    expect(MockVSCodeInfo.executeCalled).true;
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
