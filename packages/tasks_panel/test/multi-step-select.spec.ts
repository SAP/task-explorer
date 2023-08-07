import { expect } from "chai";
import { mockVscode, testVscode } from "./utils/mockVSCode";

mockVscode("/src/multi-step-select");
import { __internal } from "../src/multi-step-select";
import { cloneDeep, map, uniq } from "lodash";
import { MISC } from "../src/utils/ws-folder";

describe("multi-step-selection scope", () => {
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

  const taskContributed4 = {
    label: "Template: task4",
    prop1: "value1",
    type: "otherType",
    taskType: "testIntent",
    __wsFolder: roots[1],
    __extensionName: "testExtension",
  };

  const tasks = [taskContributed1, taskContributed2, taskNotContributed, taskContributed4];

  it("Miscellaneous item verification", async () => {
    expect(__internal.miscItem).to.be.deep.equal({ label: "$(list-unordered)", description: MISC, type: "intent" });
  });

  it("grabProjectItems", async () => {
    expect(__internal.grabProjectItems(tasks)).to.be.deep.equal(
      map(uniq(map(tasks, "__wsFolder")), (_) => {
        return { label: "$(folder)", description: _ };
      })
    );
  });

  it("grabProjectItems - project filter received", async () => {
    expect(__internal.grabProjectItems(tasks, roots[0])).to.be.deep.equal([
      { label: "$(folder)", description: roots[0] },
    ]);
  });

  it("grabProjectItems - project filter received but not matched", async () => {
    expect(__internal.grabProjectItems(tasks, "/user/unknown/path")).to.be.deep.equal(
      map(uniq(map(tasks, "__wsFolder")), (_) => {
        return { label: "$(folder)", description: _ };
      })
    );
  });

  it("grabTasksByGroup - [build/deploy] tasks found", async () => {
    expect(__internal.grabTasksByGroup(tasks, roots[0])).to.be.deep.equal([
      { label: taskContributed1.__intent, kind: testVscode.QuickPickItemKind.Separator },
      cloneDeep(taskContributed1),
      { label: MISC, kind: testVscode.QuickPickItemKind.Separator },
      __internal.miscItem,
    ]);
  });

  it("grabTasksByGroup - [misc] tasks only", async () => {
    expect(__internal.grabTasksByGroup(tasks, roots[1])).to.be.deep.equal([
      { label: MISC, kind: testVscode.QuickPickItemKind.Separator },
      __internal.miscItem,
    ]);
  });

  it("grabMiscTasksByProject", async () => {
    expect(__internal.grabMiscTasksByProject(tasks, roots[1])).to.be.deep.equal([taskNotContributed, taskContributed4]);
  });
});
