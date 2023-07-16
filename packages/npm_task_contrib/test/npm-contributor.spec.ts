import { expect } from "chai";
import { join } from "path";
import { NpmDefinitionType } from "../src/definitions";
import { TaskExplorerContributor } from "../src/npm-contributor";
import { getImage } from "../src/utils";
import { TaskUserInput } from "@sap_oss/task_contrib_types";
import { clone } from "lodash";

describe("TaskExplorerContributor unit test scope", () => {
  let instance: TaskExplorerContributor;
  const extensionPath = join(__dirname, "..");
  const task: NpmDefinitionType = {
    script: "script",
    path: "path",
    label: "",
    type: "",
  };

  before(() => {
    instance = new TaskExplorerContributor(extensionPath);
  });

  it("init", async () => {
    expect(await instance.init("", task)).to.be.undefined;
  });

  it("convertTaskToFormProperties", async () => {
    expect(await instance.convertTaskToFormProperties(task)).to.be.deep.equal([
      {
        type: "input",
        taskProperty: "script",
        readonly: true,
      },
      {
        type: "input",
        taskProperty: "path",
        readonly: true,
      },
      {
        type: "label",
      },
    ]);
  });

  it("getTaskImage", async () => {
    expect(instance.getTaskImage()).to.be.equal(getImage(join(extensionPath, "resources", "npm_48px.svg")));
  });

  it("updateTask", async () => {
    const inputs: TaskUserInput = { label: "test-label" };
    const copyTask = clone(task);
    const expectedTask = clone(task);
    expectedTask.label = inputs.label;
    expect(await instance.updateTask(copyTask, inputs)).to.be.deep.equal(expectedTask);
  });

  it("onSave", async () => {
    const copyTask = clone(task);
    copyTask.taskType = "testType";
    instance.onSave(copyTask);
    expect(copyTask.taskType).to.be.undefined;
  });
});
