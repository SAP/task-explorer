import { expect } from "chai";
import { SinonSandbox, createSandbox, SinonMock } from "sinon";
import { mockVscode, resetTestVSCode, testVscode } from "../utils/mockVSCode";
mockVscode("src/commands/action-deploy");
import { actionDeploy } from "../../src/commands/action-deploy";
import { MockTasksProvider } from "../utils/mockTasksProvider";
import { TasksTree } from "../../src/view/tasks-tree";
mockVscode("src/commands/action");
import * as action from "../../src/commands/action";

describe("action-deploy scope", () => {
  const dataProvider: Partial<TasksTree> = {
    findTreeItem: () => Promise.resolve(undefined),
  };

  const mockTaskProvider = new MockTasksProvider([]);

  let sandbox: SinonSandbox;
  let mockAction: SinonMock;
  let mockWindow: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    mockAction = sandbox.mock(action);
    mockWindow = sandbox.mock(testVscode.window);
  });

  afterEach(() => {
    mockAction.verify();
    mockWindow.verify();
    resetTestVSCode();
    sandbox.restore();
  });

  it("verify arguments chain", async () => {
    mockAction
      .expects("runAction")
      .withExactArgs("deploy", dataProvider, mockTaskProvider, testVscode.ExtensionContext)
      .resolves();
    expect(await actionDeploy(dataProvider as TasksTree, mockTaskProvider, testVscode.ExtensionContext)).to.be
      .undefined;
  });

  it("exception thrown", async () => {
    const error = new Error("test");
    mockAction
      .expects("runAction")
      .withExactArgs("deploy", dataProvider, mockTaskProvider, testVscode.ExtensionContext)
      .rejects(error);
    mockWindow.expects("showErrorMessage").withExactArgs(error.toString()).resolves();
    expect(await actionDeploy(dataProvider as TasksTree, mockTaskProvider, testVscode.ExtensionContext)).to.be
      .undefined;
  });
});
