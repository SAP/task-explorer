import {
  ConfigurationTarget,
  GlobPattern,
  RelativePattern,
  TaskDefinition,
  Uri,
  commands,
  extensions,
  window,
  workspace,
} from "vscode";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";
import * as Yaml from "yaml";
import { Dictionary, compact, concat, find, includes, map } from "lodash";

export enum TYPE_FE_DEPLOY_CFG {
  fioriDeploymentConfig = "fioriDeploymentConfig",
}

enum FE_DEPLOY_TRG {
  ABAP = "abap",
  CF = "cf",
}

const trg_files_abap = ["ui5-deploy.yaml"];
const trg_files_cf = ["ui5-deploy.yaml", "mta.yaml", "xs-app.json"];

export type FioriProjectInfo = {
  wsFolder: string;
  project: string;
  type: TYPE_FE_DEPLOY_CFG;
};

async function readTextFile(uri: Uri): Promise<string> {
  const buffer = await workspace.fs.readFile(uri);
  return Buffer.from(buffer).toString("utf8");
}

async function detectDeployTarget(ui5DeployYaml: Uri): Promise<FE_DEPLOY_TRG> {
  const yamlContext = Yaml.parse(await readTextFile(ui5DeployYaml));
  return find(yamlContext?.builder?.customTasks, ["name", "deploy-to-abap"]) ? FE_DEPLOY_TRG.ABAP : FE_DEPLOY_TRG.CF;
}

const crypto = require("crypto");

/* istanbul ignore next */
function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomBytes = crypto.randomBytes(length);

  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % characters.length;
    result += characters.charAt(randomIndex);
  }

  return result;
}

export async function getFioriE2ePickItems(wsFolder: string): Promise<FioriProjectInfo[]> {
  async function isFileExist(uri: Uri): Promise<boolean> {
    try {
      return !!(await workspace.fs.stat(uri));
    } catch (e) {
      return false;
    }
  }

  async function isConfigured(target: FE_DEPLOY_TRG, projectPath: Uri): Promise<boolean> {
    const resources: Promise<boolean>[] = [Promise.resolve(true)];
    resources.push(
      ...map(target === FE_DEPLOY_TRG.ABAP ? trg_files_abap : trg_files_cf, (file) =>
        isFileExist(Uri.joinPath(projectPath, file))
      )
    );
    return Promise.all(resources).then((values) => !includes(values, false));
  }

  async function isConfigNeeded(wsFolder: Uri, project: string): Promise<boolean> {
    let result = true;
    const projectPath = Uri.joinPath(wsFolder, project);
    const path = Uri.joinPath(projectPath, "ui5-deploy.yaml");
    if (await isFileExist(path)) {
      result = !(await isConfigured(await detectDeployTarget(path), projectPath));
    }
    return result;
  }

  const requestedFolder = Uri.file(wsFolder);
  const btaExtension: any = extensions.getExtension("SAPOSS.app-studio-toolkit");
  const basToolkitAPI: BasToolkit = btaExtension?.exports;
  const workspaceAPI = basToolkitAPI?.workspaceAPI;
  const items: Promise<FioriProjectInfo | undefined>[] = [];
  for (const project of await workspaceAPI.getProjects()) {
    const item = project.getProjectInfo().then((info) => {
      if (info) {
        const workspaceFolder = workspace.getWorkspaceFolder(Uri.file(info.path));
        if (workspaceFolder?.uri.fsPath === requestedFolder.fsPath) {
          if (info.type === "com.sap.fe") {
            const project = workspace.asRelativePath(info.path);
            return isConfigNeeded(workspaceFolder.uri, project).then((isNeeded: boolean) => {
              return isNeeded ? { wsFolder, project, type: TYPE_FE_DEPLOY_CFG.fioriDeploymentConfig } : undefined;
            });
          }
        }
      }
    });
    items.push(item);
  }
  return Promise.all(items).then((items) => compact(items));
}

export async function fioriE2eConfig(wsFolder: string, project: string): Promise<any> {
  async function waitForResource(
    pattern: GlobPattern,
    ignoreCreateEvents?: boolean,
    ignoreChangeEvents?: boolean,
    ignoreDeleteEvents?: boolean
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const fileWatcher = workspace.createFileSystemWatcher(
        pattern,
        ignoreCreateEvents,
        ignoreChangeEvents,
        ignoreDeleteEvents
      );
      function endWatch() {
        fileWatcher.dispose();
        resolve(true);
      }
      fileWatcher.onDidChange(() => endWatch());
      fileWatcher.onDidCreate(() => endWatch());
      fileWatcher.onDidDelete(() => endWatch());
    });
  }

  async function areResourcesReady(promises: Promise<boolean>[], timeout = 5): Promise<boolean> {
    return Promise.race([
      Promise.all(promises),
      new Promise((resolve) => setTimeout(() => resolve(false), timeout * 1000)),
    ]).then((status) => {
      if (typeof status === "boolean") {
        // timeout
        return status; // false
      } else {
        // [statuses]
        return !includes(status as Dictionary<boolean>, false);
      }
    });
  }

  async function addTaskDefinition(tasks: TaskDefinition[]): Promise<any> {
    const tasksConfig = workspace.getConfiguration("tasks", Uri.file(wsFolder));
    await tasksConfig.update(
      "tasks",
      concat(tasksConfig.get("tasks") ?? [], tasks),
      ConfigurationTarget.WorkspaceFolder
    );
  }

  async function completeTasksDefinition(target: FE_DEPLOY_TRG): Promise<any> {
    // Generate a random string of length between 4 and 8 characters
    const randomStringLength = Math.floor(Math.random() * 5) + 4; // Random length between 4 and 8
    const randomString = generateRandomString(randomStringLength);
    //
    const tasks: TaskDefinition[] = [];
    if (target === FE_DEPLOY_TRG.ABAP) {
      tasks.push({ type: "npm", label: `deploy to ABAP (${randomString}): ${project}`, script: "deploy" });
    } else {
      // FE_DEPLOY_TRG.CF
      const taskBuild = {
        type: "build.mta",
        label: `Build MTA (${randomString}): ${project}`,
        taskType: "Build",
        projectPath: `${Uri.joinPath(Uri.file(wsFolder), project).fsPath}`,
        extensions: [],
      };
      const taskDeploy = {
        type: "deploy.mta.cf",
        label: `Deploy MTA to Cloud Foundry (${randomString}): ${Uri.joinPath(Uri.file(wsFolder), project).fsPath}`,
        taskType: "Deploy",
        mtarPath: `${Uri.joinPath(Uri.file(wsFolder), project).fsPath}/mta_archives/${project}_0.0.1.mtar`,
        extensions: [],
        cfTarget: "",
        cfEndpoint: "",
        cfOrg: "",
        cfSpace: "",
        dependsOn: [`${taskBuild.label}`],
      };
      tasks.push(taskBuild, taskDeploy);
    }
    return addTaskDefinition(tasks);
  }

  async function launchConfig(): Promise<void> {
    const ui5DeployYaml = waitForResource(
      new RelativePattern(wsFolder, `${project}/ui5-deploy.yaml`),
      false,
      false,
      true
    );
    await commands.executeCommand("sap.ux.appGenerator.launchDeployConfig", { fsPath: wsFolder });
    if (await areResourcesReady([ui5DeployYaml])) {
      await completeTasksDefinition(
        await detectDeployTarget(Uri.joinPath(Uri.file(wsFolder), project, "ui5-deploy.yaml"))
      );
    }
  }

  return launchConfig();
}
