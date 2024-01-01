import { expect } from "chai";
import { SinonMock, SinonSandbox, createSandbox } from "sinon";
import { resetTestVSCode } from "../utils/mockVSCode";
import * as e2eConfig from "../../src/misc/e2e-config";
import {
  completeDeployConfig,
  composeDeploymentConfigLabel,
  getConfigDeployPickItems,
  isDeploymentConfigTask,
} from "../../src/misc/common-e2e-config";
import * as fiori from "../../src/misc/fiori-e2e-config";
import * as cap from "../../src/misc/cap-e2e-config";
import * as hana from "../../src/misc/hana-e2e-config";

describe("common-e2e-config scope", () => {
  let sandbox: SinonSandbox;
  let mockFioriE2eConfig: SinonMock;
  let mockCapE2eConfig: SinonMock;
  let mockHanaE2eConfig: SinonMock;

  before(() => {
    sandbox = createSandbox();
    mockFioriE2eConfig = sandbox.mock(fiori);
    mockCapE2eConfig = sandbox.mock(cap);
    mockHanaE2eConfig = sandbox.mock(hana);
  });

  afterEach(() => {
    mockFioriE2eConfig.verify();
    mockCapE2eConfig.verify();
    mockHanaE2eConfig.verify();

    sandbox.restore();
    resetTestVSCode();
  });

  describe("isDeploymentConfigTask function", () => {
    it("isDeploymentConfigTask - FIORI_DEPLOYMENT_CONFIG", async () => {
      expect(isDeploymentConfigTask({ type: e2eConfig.FIORI_DEPLOYMENT_CONFIG })).to.be.true;
    });

    it("isDeploymentConfigTask - HANA_DEPLOYMENT_CONFIG", async () => {
      expect(isDeploymentConfigTask({ type: e2eConfig.HANA_DEPLOYMENT_CONFIG })).to.be.true;
    });

    it("isDeploymentConfigTask - CAP_DEPLOYMENT_CONFIG", async () => {
      expect(isDeploymentConfigTask({ type: e2eConfig.CAP_DEPLOYMENT_CONFIG })).to.be.true;
    });

    it("isDeploymentConfigTask - other", async () => {
      expect(isDeploymentConfigTask({ type: "unsupported" })).to.be.false;
    });
  });

  describe("completeDeployConfig function", () => {
    it("completeDeployConfig - FIORI_DEPLOYMENT_CONFIG", async () => {
      mockFioriE2eConfig
        .expects("fioriE2eConfig")
        .once()
        .withExactArgs({ wsFolder: "ws-folder", project: "project" })
        .resolves();
      expect(
        await completeDeployConfig({
          wsFolder: "ws-folder",
          project: "project",
          type: e2eConfig.FIORI_DEPLOYMENT_CONFIG,
        }),
      ).to.be.undefined;
    });

    it("completeDeployConfig - CAP_DEPLOYMENT_CONFIG", async () => {
      mockCapE2eConfig
        .expects("capE2eConfig")
        .once()
        .withExactArgs({ wsFolder: "ws-folder", project: "project" })
        .resolves();
      expect(
        await completeDeployConfig({
          wsFolder: "ws-folder",
          project: "project",
          type: e2eConfig.CAP_DEPLOYMENT_CONFIG,
        }),
      ).to.be.undefined;
    });

    it("completeDeployConfig - HANA_DEPLOYMENT_CONFIG", async () => {
      mockHanaE2eConfig
        .expects("hanaE2eConfig")
        .once()
        .withExactArgs({ wsFolder: "ws-folder", project: "project" })
        .resolves();
      expect(
        await completeDeployConfig({
          wsFolder: "ws-folder",
          project: "project",
          type: e2eConfig.HANA_DEPLOYMENT_CONFIG,
        }),
      ).to.be.undefined;
    });

    it("completeDeployConfig - unsupported", async () => {
      expect(await completeDeployConfig({ wsFolder: "ws-folder", project: "project", type: "other" })).to.be.undefined;
    });
  });

  describe("getConfigDeployPickItems function", () => {
    const project = "project";

    let mockE2eConfig: SinonMock;

    beforeEach(() => {
      mockE2eConfig = sandbox.mock(e2eConfig);
    });

    afterEach(() => {
      mockE2eConfig.verify();
    });

    it("getConfigDeployPickItems - no projects found", async () => {
      mockE2eConfig.expects("collectProjects").once().withExactArgs(project).resolves([]);
      expect(await getConfigDeployPickItems(project)).to.be.empty;
    });

    it("getConfigDeployPickItems - projects found", async () => {
      const info = { wsFolder: "ws-folder" };
      mockE2eConfig
        .expects("collectProjects")
        .once()
        .withExactArgs(project)
        .resolves([
          { ...info, ...{ style: e2eConfig.ProjTypes.FIORI_FE }, ...{ project: "project1" } },
          { ...info, ...{ style: e2eConfig.ProjTypes.CAP }, ...{ project: "project2" } },
          { ...info, ...{ style: "other" }, ...{ project: "project4" } },
          { ...info, ...{ style: e2eConfig.ProjTypes.HANA }, ...{ project: "project3" } },
        ]);

      mockHanaE2eConfig
        .expects("getHanaE2ePickItems")
        .once()
        .withExactArgs({ ...info, ...{ style: e2eConfig.ProjTypes.HANA }, ...{ project: "project3" } })
        .resolves({ ...info, ...{ type: e2eConfig.HANA_DEPLOYMENT_CONFIG }, ...{ project: "project3" } });

      mockFioriE2eConfig
        .expects("getFioriE2ePickItems")
        .once()
        .withExactArgs({ ...info, ...{ style: e2eConfig.ProjTypes.FIORI_FE }, ...{ project: "project1" } })
        .resolves({ ...info, ...{ type: e2eConfig.FIORI_DEPLOYMENT_CONFIG }, ...{ project: "project1" } });

      mockCapE2eConfig
        .expects("getCapE2ePickItems")
        .once()
        .withExactArgs({ ...info, ...{ style: e2eConfig.ProjTypes.CAP }, ...{ project: "project2" } })
        .resolves({ ...info, ...{ type: e2eConfig.CAP_DEPLOYMENT_CONFIG }, ...{ project: "project2" } });

      expect(await getConfigDeployPickItems(project)).to.be.deep.equal([
        { ...info, ...{ type: e2eConfig.FIORI_DEPLOYMENT_CONFIG }, ...{ project: "project1" } },
        { ...info, ...{ type: e2eConfig.CAP_DEPLOYMENT_CONFIG }, ...{ project: "project2" } },
        { ...info, ...{ type: e2eConfig.HANA_DEPLOYMENT_CONFIG }, ...{ project: "project3" } },
      ]);
    });
  });

  describe("composeDeploymentConfigLabel function", () => {
    it("composeDeploymentConfigLabel - unknown type", async () => {
      expect(composeDeploymentConfigLabel("other")).to.be.equal("Unknown Configuration");
    });

    it("composeDeploymentConfigLabel - FIORI_DEPLOYMENT_CONFIG type", async () => {
      expect(composeDeploymentConfigLabel(e2eConfig.FIORI_DEPLOYMENT_CONFIG)).to.be.equal("Fiori Configuration");
    });

    it("composeDeploymentConfigLabel - CAP_DEPLOYMENT_CONFIG type", async () => {
      expect(composeDeploymentConfigLabel(e2eConfig.CAP_DEPLOYMENT_CONFIG)).to.be.equal("Full Stack Configuration");
    });

    it("composeDeploymentConfigLabel - HANA_DEPLOYMENT_CONFIG type", async () => {
      expect(composeDeploymentConfigLabel(e2eConfig.HANA_DEPLOYMENT_CONFIG)).to.be.equal("Hana Configuration");
    });
  });
});
