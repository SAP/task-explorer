import { expect } from "chai";
import { fail } from "assert";
import { mockVscode, testVscode } from "../utils/mockVSCode";

mockVscode("/src/fiori-e2e-config");
import { each, last, split } from "lodash";
import { SinonMock, SinonSandbox, createSandbox } from "sinon";
import { TYPE_FE_DEPLOY_CFG, fioriE2eConfig, getFioriE2ePickItems } from "../../src/misc/fiori-e2e-config";

describe("fiori-e2e-config scope", () => {
  let sandbox: SinonSandbox;
  let mockWorkspaceFs: SinonMock;
  let mockWorkspace: SinonMock;
  let mockCommands: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    mockWorkspace = sandbox.mock(testVscode.workspace);
    mockWorkspaceFs = sandbox.mock(testVscode.workspace.fs);
    mockCommands = sandbox.mock(testVscode.commands);
  });

  afterEach(() => {
    mockWorkspace.verify();
    mockWorkspaceFs.verify();
    mockCommands.verify();
    sandbox.restore();
  });

  const ui5DeployYamlCf = `
# yaml-language-server
builder:
  customTasks:
  - name: something
  - name: other-zipper
    afterTask: generateCachebusterInfo
`;
  const ui5DeployYamlAbap = `
builder:
  customTasks:
  - name: deploy-to-abap
`;

  describe("getFioriE2ePickItems scope", () => {
    let mockExtensions: SinonMock;

    beforeEach(() => {
      mockExtensions = sandbox.mock(testVscode.extensions);
    });

    afterEach(() => {
      mockExtensions.verify();
    });

    const projectInfo = {
      path: "/home/user/test/project",
      type: "com.sap.fe",
    };
    const feProject = {
      getProjectInfo: () => Promise.resolve(projectInfo),
    };
    const btaExtension = {
      exports: {
        workspaceAPI: {
          getProjects: (): Promise<any> => Promise.resolve([]),
        },
      },
    };

    it("getFioriE2ePickItems - fiori tools generator not registered", async () => {
      mockCommands.expects("getCommands").resolves([]);
      expect(await getFioriE2ePickItems("/test/project")).to.be.deep.equal([]);
    });

    it("getFioriE2ePickItems - toolkit extension is not configured well", async () => {
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns({
        exports: null,
      });
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      expect(await getFioriE2ePickItems("/test/project")).to.be.deep.equal([]);
    });

    it("getFioriE2ePickItems - toolkit extension is not configured well (cont.)", async () => {
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(undefined);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      expect(await getFioriE2ePickItems("/test/project")).to.be.deep.equal([]);
    });

    it("getFioriE2ePickItems - no project found", async () => {
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      expect(await getFioriE2ePickItems("/test/project")).to.be.deep.equal([]);
    });

    it("getFioriE2ePickItems - project found, projectInfo undefined", async () => {
      sandbox.stub(feProject, "getProjectInfo").resolves();
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      expect(await getFioriE2ePickItems("/test/project")).to.be.deep.equal([]);
    });

    it("getFioriE2ePickItems - project found, but the project does not match the requested path", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      const wsFolder = { uri: { fsPath: "/home/user/test/" } };
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(wsFolder);
      expect(await getFioriE2ePickItems("/test/project")).to.be.deep.equal([]);
    });

    it("getFioriE2ePickItems - project found, related workspace folder doesn't exist", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(undefined);
      expect(await getFioriE2ePickItems("/test/project")).to.be.deep.equal([]);
    });

    it("getFioriE2ePickItems - project found, but the project type does not match the fiori 'fe' type", async () => {
      sandbox.stub(feProject, "getProjectInfo").resolves({
        path: "/home/user/test/project",
        type: "com.sap.other",
      });
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      const wsFolder = { uri: { fsPath: "/home/user/test/" } };
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(wsFolder);
      expect(await getFioriE2ePickItems("/home/user/test/")).to.be.deep.equal([]);
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' does not exist, config required", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      const wsFolder = { uri: { path: "/home/user/test/", fsPath: "/home/user/test/" } };
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(wsFolder);
      const project = last(split(projectInfo.path, "/"));
      mockWorkspace.expects("asRelativePath").withExactArgs(projectInfo.path, false).returns(project);
      mockWorkspaceFs
        .expects("stat")
        .withExactArgs(testVscode.Uri.joinPath(wsFolder.uri, project, "ui5-deploy.yaml"))
        .rejects(new Error());
      expect(await getFioriE2ePickItems("/home/user/test/")).to.be.deep.equal([
        { wsFolder: wsFolder.uri.fsPath, project, type: TYPE_FE_DEPLOY_CFG.fioriDeploymentConfig },
      ]);
    });

    it("getFioriE2ePickItems - fiori project found, project relative path is empty (sigle root), 'ui5-deploy.yaml' does not exist, config required", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      const wsFolder = { uri: { path: "/home/user/test/project", fsPath: "/home/user/test/project" } };
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(wsFolder);
      mockWorkspace.expects("asRelativePath").withExactArgs(projectInfo.path, false).returns(wsFolder.uri.fsPath);
      mockWorkspaceFs
        .expects("stat")
        .withExactArgs(testVscode.Uri.joinPath(wsFolder.uri, "ui5-deploy.yaml"))
        .rejects(new Error());
      expect(await getFioriE2ePickItems("/home/user/test/project")).to.be.deep.equal([
        { wsFolder: wsFolder.uri.fsPath, project: "", type: TYPE_FE_DEPLOY_CFG.fioriDeploymentConfig },
      ]);
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist but unsupported target", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      const wsFolder = { uri: { path: "/home/user/test/", fsPath: "/home/user/test/" } };
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(wsFolder);
      const project = last(split(projectInfo.path, "/"));
      mockWorkspace.expects("asRelativePath").withExactArgs(projectInfo.path, false).returns(project);
      const uriUi5DeployYaml = testVscode.Uri.joinPath(wsFolder.uri, project, "ui5-deploy.yaml");
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      const wrongUi5DeployYaml = `
specVersion: '2.4'
`;
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(wrongUi5DeployYaml, `utf8`));
      expect(await getFioriE2ePickItems("/home/user/test/")).to.be.deep.equal([
        { wsFolder: wsFolder.uri.fsPath, project, type: TYPE_FE_DEPLOY_CFG.fioriDeploymentConfig },
      ]);
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist but empty", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      const wsFolder = { uri: { path: "/home/user/test/", fsPath: "/home/user/test/" } };
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(wsFolder);
      const project = last(split(projectInfo.path, "/"));
      mockWorkspace.expects("asRelativePath").withExactArgs(projectInfo.path, false).returns(project);
      const uriUi5DeployYaml = testVscode.Uri.joinPath(wsFolder.uri, project, "ui5-deploy.yaml");
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      const wrongUi5DeployYaml = ``;
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(wrongUi5DeployYaml, `utf8`));
      expect(await getFioriE2ePickItems("/home/user/test/")).to.be.deep.equal([
        { wsFolder: wsFolder.uri.fsPath, project, type: TYPE_FE_DEPLOY_CFG.fioriDeploymentConfig },
      ]);
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist, target 'cf', config isn't required", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      const wsFolder = { uri: { path: "/home/user/test/", fsPath: "/home/user/test/" } };
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(wsFolder);
      const project = last(split(projectInfo.path, "/"));
      mockWorkspace.expects("asRelativePath").withExactArgs(projectInfo.path, false).returns(project);
      const uriUi5DeployYaml = testVscode.Uri.joinPath(wsFolder.uri, project, "ui5-deploy.yaml");
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      each(["ui5-deploy.yaml", "mta.yaml", "xs-app.json"], (_) => {
        mockWorkspaceFs.expects("stat").withExactArgs(testVscode.Uri.joinPath(wsFolder.uri, project, _)).resolves(true);
      });
      expect(await getFioriE2ePickItems("/home/user/test/")).to.be.deep.equal([]);
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist, target 'cf', config is required (one of files isn't exists)", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      const wsFolder = { uri: { path: "/home/user/test/", fsPath: "/home/user/test/" } };
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(wsFolder);
      const project = last(split(projectInfo.path, "/"));
      mockWorkspace.expects("asRelativePath").withExactArgs(projectInfo.path, false).returns(project);
      const uriUi5DeployYaml = testVscode.Uri.joinPath(wsFolder.uri, project, "ui5-deploy.yaml");
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      each(["ui5-deploy.yaml", "mta.yaml", "xs-app.json"], (v, k) => {
        mockWorkspaceFs
          .expects("stat")
          .withExactArgs(testVscode.Uri.joinPath(wsFolder.uri, project, v))
          .resolves(k % 2 === 0);
      });
      expect(await getFioriE2ePickItems("/home/user/test/")).to.be.deep.equal([
        { wsFolder: wsFolder.uri.fsPath, project, type: TYPE_FE_DEPLOY_CFG.fioriDeploymentConfig },
      ]);
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist, target 'abap', config isn't required", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      const wsFolder = { uri: { path: "/home/user/test/", fsPath: "/home/user/test/" } };
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(wsFolder);
      const project = last(split(projectInfo.path, "/"));
      mockWorkspace.expects("asRelativePath").withExactArgs(projectInfo.path, false).returns(project);
      const uriUi5DeployYaml = testVscode.Uri.joinPath(wsFolder.uri, project, "ui5-deploy.yaml");
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlAbap, `utf8`));
      each(["ui5-deploy.yaml"], (_) => {
        mockWorkspaceFs.expects("stat").withExactArgs(testVscode.Uri.joinPath(wsFolder.uri, project, _)).resolves(true);
      });
      expect(await getFioriE2ePickItems("/home/user/test/")).to.be.deep.equal([]);
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist, target 'abap', config is required (one of files isn't exists)", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([feProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      const wsFolder = { uri: { path: "/home/user/test/", fsPath: "/home/user/test/" } };
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(wsFolder);
      const project = last(split(projectInfo.path, "/"));
      mockWorkspace.expects("asRelativePath").withExactArgs(projectInfo.path, false).returns(project);
      const uriUi5DeployYaml = testVscode.Uri.joinPath(wsFolder.uri, project, "ui5-deploy.yaml");
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlAbap, `utf8`));
      each(["ui5-deploy.yaml"], (v, k) => {
        mockWorkspaceFs
          .expects("stat")
          .withExactArgs(testVscode.Uri.joinPath(wsFolder.uri, project, v))
          .resolves(k % 2 !== 0);
      });
      expect(await getFioriE2ePickItems("/home/user/test/")).to.be.deep.equal([
        { wsFolder: wsFolder.uri.fsPath, project, type: TYPE_FE_DEPLOY_CFG.fioriDeploymentConfig },
      ]);
    });
  });

  describe("fioriE2eConfig scope", () => {
    const wsFolder = "/home/test/";
    const project = "/project";
    const uriUi5DeployYaml = testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), project, "ui5-deploy.yaml");

    let tasks: any[] = [];
    const callbacks = {};
    const watcher = {
      dispose: () => true,
      onDidChange: (c) => {
        callbacks["change"] = c;
      },
      onDidCreate: (r) => {
        callbacks["create"] = r;
      },
      onDidDelete: (d) => {
        callbacks["delete"] = d;
      },
    };

    const taskConfig = {
      get: (_) => {
        if (_ === "tasks") {
          return tasks;
        }
      },
      update: (_, _tasks, target) => {
        if (_ === "tasks" && target === 3 /* ConfigurationTarget.WorkspaceFolder */) {
          tasks = _tasks;
        }
      },
    };

    beforeEach(() => {
      mockCommands
        .expects("executeCommand")
        .withExactArgs("sap.ux.appGenerator.launchDeployConfig", { fsPath: wsFolder })
        .resolves();
      mockWorkspace
        .expects("createFileSystemWatcher")
        .withExactArgs(new testVscode.RelativePattern(wsFolder, "/project/ui5-deploy.yaml"), false, false, true)
        .returns(watcher);
    });

    afterEach(() => {
      tasks = [];
    });

    it("fioriE2eConfig, deploy.yaml is not updated - timeout reached", async () => {
      expect(await fioriE2eConfig(wsFolder, project)).to.be.undefined;
    }).timeout(6000);

    it("fioriE2eConfig, deploy.yaml is updated, target ABAP, task defined", async () => {
      tasks.push({ label: "test" });
      setTimeout(() => {
        callbacks["change"]();
      });
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlAbap, `utf8`));
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("tasks", testVscode.Uri.file(wsFolder))
        .returns(taskConfig);
      await fioriE2eConfig(wsFolder, project);
      expect(/^Deploy to ABAP/.test((tasks[1] as any).label)).to.be.true;
      expect((tasks[1] as any).type).to.be.equal("npm");
      expect((tasks[1] as any).options).to.be.deep.equal({
        cwd: `${testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), project).fsPath}`,
      });
      expect((tasks[1] as any).script).to.be.equal("deploy");
    });

    it("fioriE2eConfig, deploy.yaml is updated, target CF, tasks defined", async () => {
      (tasks as any) = undefined;
      setTimeout(() => {
        callbacks["create"]();
      });
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("tasks", testVscode.Uri.file(wsFolder))
        .returns(taskConfig);
      await fioriE2eConfig(wsFolder, project);
      expect(/^Build MTA/.test((tasks[0] as any).label)).to.be.true;
      expect((tasks[0] as any).type).to.be.equal("build.mta");
      expect((tasks[0] as any).taskType).to.be.equal("Build");
      expect((tasks[0] as any).projectPath).to.be.equal(
        testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), project).fsPath
      );
      expect((tasks[0] as any).extensions).to.be.deep.equal([]);
      expect(/^Deploy MTA to Cloud Foundry/.test((tasks[1] as any).label)).to.be.true;
      expect((tasks[1] as any).type).to.be.equal("deploy.mta.cf");
      expect((tasks[1] as any).taskType).to.be.equal("Deploy");
      expect((tasks[1] as any).mtarPath).to.be.equal(
        `${testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), project).fsPath}/mta_archives/${project}_0.0.1.mtar`
      );
      expect((tasks[1] as any).extensions).to.be.deep.equal([]);
      expect((tasks[1] as any).cfTarget).to.be.empty;
      expect((tasks[1] as any).cfEndpoint).to.be.empty;
      expect((tasks[1] as any).cfOrg).to.be.empty;
      expect((tasks[1] as any).cfSpace).to.be.empty;
      expect((tasks[1] as any).dependsOn).to.be.deep.equal([`${tasks[0].label}`]);
    });

    it("fioriE2eConfig, deploy.yaml is updated, target unexpected", async () => {
      tasks.push({ label: "test" });
      setTimeout(() => {
        callbacks["delete"]();
      });
      mockWorkspaceFs.expects("readFile").withExactArgs(uriUi5DeployYaml).resolves(Buffer.from("", `utf8`));
      try {
        await fioriE2eConfig(wsFolder, project);
        fail("should fail");
      } catch (e: any) {
        expect(e.message).to.be.equal("Unable to complete the tasks definition - unsupported deployment target");
      }
    });
  });

  describe("fioriE2eConfig scope - single root", () => {
    const wsFolder = "/home/test/my-project";
    const project = "";
    const uriUi5DeployYaml = testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), "ui5-deploy.yaml");

    let tasks: any[] = [];
    const callbacks = {};
    const watcher = {
      dispose: () => true,
      onDidChange: (c) => {
        callbacks["change"] = c;
      },
      onDidCreate: (r) => {
        callbacks["create"] = r;
      },
      onDidDelete: (d) => {
        callbacks["delete"] = d;
      },
    };

    const taskConfig = {
      get: (_) => {
        if (_ === "tasks") {
          return tasks;
        }
      },
      update: (_, _tasks, target) => {
        if (_ === "tasks" && target === 3 /* ConfigurationTarget.WorkspaceFolder */) {
          tasks = _tasks;
        }
      },
    };

    beforeEach(() => {
      mockCommands
        .expects("executeCommand")
        .withExactArgs("sap.ux.appGenerator.launchDeployConfig", { fsPath: wsFolder })
        .resolves();
      mockWorkspace
        .expects("createFileSystemWatcher")
        .withExactArgs(new testVscode.RelativePattern(wsFolder, "ui5-deploy.yaml"), false, false, true)
        .returns(watcher);
    });

    afterEach(() => {
      tasks = [];
    });

    it("fioriE2eConfig, deploy.yaml is updated, target CF, tasks defined", async () => {
      (tasks as any) = undefined;
      setTimeout(() => {
        callbacks["create"]();
      });
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("tasks", testVscode.Uri.file(wsFolder))
        .returns(taskConfig);
      await fioriE2eConfig(wsFolder, project);
      expect(/^Build MTA/.test((tasks[0] as any).label)).to.be.true;
      expect((tasks[0] as any).type).to.be.equal("build.mta");
      expect((tasks[0] as any).taskType).to.be.equal("Build");
      expect((tasks[0] as any).projectPath).to.be.equal(
        testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), project).fsPath
      );
      expect((tasks[0] as any).extensions).to.be.deep.equal([]);
      expect(/^Deploy MTA to Cloud Foundry/.test((tasks[1] as any).label)).to.be.true;
      expect((tasks[1] as any).type).to.be.equal("deploy.mta.cf");
      expect((tasks[1] as any).taskType).to.be.equal("Deploy");
      expect((tasks[1] as any).mtarPath).to.be.equal(
        `${testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), project).fsPath}/mta_archives/my-project_0.0.1.mtar`
      );
      expect((tasks[1] as any).extensions).to.be.deep.equal([]);
      expect((tasks[1] as any).cfTarget).to.be.empty;
      expect((tasks[1] as any).cfEndpoint).to.be.empty;
      expect((tasks[1] as any).cfOrg).to.be.empty;
      expect((tasks[1] as any).cfSpace).to.be.empty;
      expect((tasks[1] as any).dependsOn).to.be.deep.equal([`${tasks[0].label}`]);
    });
  });
});