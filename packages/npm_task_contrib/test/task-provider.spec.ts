import { expect } from "chai";
import { mockVscode, testVscode } from "./utils/mockVSCode";

mockVscode("src/task-provider");
import { NpmTaskProvider } from "../src/task-provider";
import { Task, TaskScope } from "vscode";
import { cloneDeep, set } from "lodash";
import { stub } from "sinon";

describe("TaskProvider unit test scope", () => {
  const provider = new NpmTaskProvider();
  const task = {
    name: "label",
    type: "type",
    definition: { script: "script", path: "path" },
    scope: { uri: { path: "/my/project/" } },
  };

  it("provideTasks", async () => {
    expect(await provider.provideTasks()).to.be.deep.equal([]);
  });

  it("resolveTask, cwd resolved", async () => {
    const resolved = provider.resolveTask(task as unknown as Task);
    expect(resolved).to.be.exist;
    expect((<Task>resolved).definition).to.be.deep.equal(task.definition);
  });

  it("resolveTask, cwd resolved", async () => {
    const other = cloneDeep(task) as unknown as Task;
    delete (<any>other).scope;
    expect(provider.resolveTask(other)).to.be.exist;
  });

  it("resolveCwd, task.scope undefined", async () => {
    const other = cloneDeep(task) as unknown as Task;
    set(other, "scope", TaskScope.Workspace);
    expect(provider["resolveCwd"](other)).to.be.undefined;
  });

  it("resolveCwd, task.scope undefined, but workspace set", async () => {
    stub(testVscode.workspace, "workspaceFolders").value([{ uri: { path: "/project//my" } }]);
    const other = cloneDeep(task) as unknown as Task;
    set(other, "scope", TaskScope.Workspace);
    expect(provider["resolveCwd"](other)).to.be.equal("/project/my");
  });
});
