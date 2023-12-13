import { expect } from "chai";
import { MockVSCodeInfo, mockVscode, resetTestVSCode, testVscode } from "../utils/mockVSCode";
import { SinonMock, SinonSandbox, createSandbox } from "sinon";
import * as e2eConfig from "../../src/misc/e2e-config";
import { getHanaE2ePickItems, hanaE2eConfig } from "../../src/misc/hana-e2e-config";
import { assign, size } from "lodash";

mockVscode("/src/hana-e2e-config");

describe("hana-e2e-config scope", () => {
  let sandbox: SinonSandbox;

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
    resetTestVSCode();
  });

  describe("getHanaE2ePickItems scope", () => {
    const info: e2eConfig.ProjectInfo = {
      wsFolder: "ws-folder",
      project: "project",
      style: e2eConfig.ProjectTypes.HANA,
    };

    it("getHanaE2ePickItems - incorrect type", async () => {
      expect(await getHanaE2ePickItems(assign({}, info, { style: "hana" }))).to.be.undefined;
    });

    it("getHanaE2ePickItems - ok", async () => {
      sandbox.stub(e2eConfig, "isTasksSettled").returns(false);
      expect(await getHanaE2ePickItems(info)).to.be.deep.equal(
        assign({}, info, { type: e2eConfig.HANA_DEPLOYMENT_CONFIG })
      );
    });

    it("getHanaE2ePickItems - tasks settled, project configured", async () => {
      sandbox.stub(e2eConfig, "isTasksSettled").returns(true);
      expect(await getHanaE2ePickItems(info)).to.be.undefined;
    });
  });

  describe("hanaE2eConfig scope", () => {
    let mockCommands: SinonMock;

    beforeEach(() => {
      mockCommands = sandbox.mock(testVscode.commands);
    });

    afterEach(() => {
      mockCommands.verify();
    });

    const data = {
      wsFolder: "ws-folder",
      project: "project",
    };

    it("hanaE2eConfig - tasks added", async () => {
      mockCommands.expects("executeCommand").withArgs("tasks-explorer.editTask").resolves();
      mockCommands.expects("executeCommand").withArgs("tasks-explorer.tree.select").resolves();
      await hanaE2eConfig(data);
      const _configuredTasks = MockVSCodeInfo.configTasks?.get(data.wsFolder);
      expect(size(_configuredTasks)).to.be.equal(2);
    });
  });
});
