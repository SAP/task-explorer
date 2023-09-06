import {
  ConfigurationTarget,
  GlobPattern,
  RelativePattern,
  TaskDefinition,
  Uri,
  commands,
  extensions,
  workspace,
} from "vscode";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";
import * as Yaml from "yaml";
import * as path from "path";
import { Dictionary, compact, concat, find, includes, last, map, split, extend, isEmpty, size } from "lodash";
import { cfGetTargets, cfGetConfigFileField, DEFAULT_TARGET } from "@sap/cf-tools";
import { getLogger } from "../logger/logger-wrapper";
import { messages } from "../i18n/messages";

export enum TYPE_FE_DEPLOY_CFG {
  fioriDeploymentConfig = "fioriDeploymentConfig",
}

enum FE_DEPLOY_TRG {
  ABAP = "abap",
  CF = "cf",
}

type CfDetails = {
  cfTarget: string;
  cfEndpoint: string;
  cfOrg: string;
  cfSpace: string;
};

const cmd_launch_deploy_config = "sap.ux.appGenerator.launchDeployConfig";

const trg_files_common = ["ui5-deploy.yaml"];
const trg_files_abap = concat(trg_files_common, []);
const trg_files_cf = concat(trg_files_common, ["mta.yaml", "xs-app.json"]);

export type FioriProjectInfo = {
  wsFolder: string;
  project: string;
  type: TYPE_FE_DEPLOY_CFG;
};

async function readTextFile(uri: Uri): Promise<string> {
  const buffer = await workspace.fs.readFile(uri);
  return Buffer.from(buffer).toString("utf8");
}

async function detectDeployTarget(ui5DeployYaml: Uri): Promise<FE_DEPLOY_TRG | undefined> {
  try {
    const yamlContext = Yaml.parse(await readTextFile(ui5DeployYaml));
    if (!yamlContext?.builder?.customTasks) {
      throw new Error("Unsupported target configuration found");
    }
    return find(yamlContext.builder.customTasks, ["name", "deploy-to-abap"]) ? FE_DEPLOY_TRG.ABAP : FE_DEPLOY_TRG.CF;
  } catch (e: any) {
    getLogger().error(e.toString());
  }
}

export async function getFioriE2ePickItems(wsFolder: string): Promise<FioriProjectInfo[]> {
  async function isFileExist(uri: Uri): Promise<boolean> {
    try {
      return !!(await workspace.fs.stat(uri));
    } catch (e) {
      return false;
    }
  }

  async function isConfigured(target: FE_DEPLOY_TRG | undefined, projectPath: Uri): Promise<boolean> {
    if (!target) {
      // error [reading|parsing|unexpected structure] yaml file
      return false;
    }
    const resources: Promise<boolean>[] = [Promise.resolve(true)];
    resources.push(
      ...map(target === FE_DEPLOY_TRG.ABAP ? trg_files_abap : trg_files_cf, (file) =>
        isFileExist(Uri.joinPath(projectPath, file))
      )
    );
    return Promise.all(resources).then((values) => !includes(values, false));
  }

  async function isConfigRequired(wsFolder: Uri, project: string): Promise<boolean> {
    let result = true;
    const projectPath = Uri.joinPath(wsFolder, project);
    const path = Uri.joinPath(projectPath, "ui5-deploy.yaml");
    if (await isFileExist(path)) {
      result = !(await isConfigured(await detectDeployTarget(path), projectPath));
    }
    return result;
  }

  function asWsRelativePath(absPath: string): string {
    let project = workspace.asRelativePath(absPath, false);
    if (project === absPath) {
      project = ""; // single root
    }
    return project;
  }

  async function isCommandRegistered(command: string): Promise<boolean> {
    return commands.getCommands().then((allCommands) => {
      return allCommands.includes(command);
    });
  }

  const items: Promise<FioriProjectInfo | undefined>[] = [];
  // start analyzing when the corresponding generator command exists and is registered in devspace, otherwise the config e2e deployment option should not be displayed
  if (await isCommandRegistered(cmd_launch_deploy_config)) {
    const requestedFolder = Uri.file(wsFolder);
    const btaExtension: any = extensions.getExtension("SAPOSS.app-studio-toolkit");
    const basToolkitAPI: BasToolkit = btaExtension?.exports;
    const workspaceAPI = basToolkitAPI?.workspaceAPI ?? { getProjects: () => Promise.resolve([]) };

    for (const project of await workspaceAPI.getProjects()) {
      const item = project.getProjectInfo().then((info) => {
        if (info) {
          const workspaceFolder = workspace.getWorkspaceFolder(Uri.file(info.path));
          if (workspaceFolder?.uri.fsPath.startsWith(requestedFolder.fsPath)) {
            if (info.type === "com.sap.fe") {
              const project = asWsRelativePath(info.path);
              return isConfigRequired(workspaceFolder.uri, project).then((isRequired: boolean) => {
                return isRequired ? { wsFolder, project, type: TYPE_FE_DEPLOY_CFG.fioriDeploymentConfig } : undefined;
              });
            }
          }
        }
      });
      items.push(item);
    }
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

  /**
   *
   * @param promises - Promise<boolean>[] array to waiting for
   * @param timeout - maximum wait time in seconds
   * @returns
   */
  async function areResourcesReady(promises: Promise<boolean>[], timeout = 5): Promise<boolean> {
    return Promise.race([
      Promise.all(promises),
      new Promise((resolve) => setTimeout(() => resolve(false), timeout * 1000)),
    ]).then((status) => {
      if (typeof status === "boolean") {
        // timeout occurred
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

  async function populateCfDetails(): Promise<CfDetails> {
    try {
      const targets = await cfGetTargets();
      if (isEmpty(targets) || (size(targets) === 1 && targets[0].label === DEFAULT_TARGET)) {
        throw new Error("No CF targets found");
      }
      const targetName = find(targets, "isCurrent")?.label;
      if (!targetName) {
        throw new Error("No CF current target defined");
      }
      return {
        cfTarget: targetName,
        cfEndpoint: (await cfGetConfigFileField("Target", targetName)) ?? "",
        cfOrg: (await cfGetConfigFileField("OrganizationFields", targetName))?.Name ?? "",
        cfSpace: (await cfGetConfigFileField("SpaceFields", targetName))?.Name ?? "",
      };
    } catch (e: any) {
      getLogger().debug(`Can not populate cf target details`, { reason: e.toString() });
      return { cfTarget: "", cfEndpoint: "", cfOrg: "", cfSpace: "" };
    }
  }

  async function completeTasksDefinition(target: FE_DEPLOY_TRG | undefined): Promise<any> {
    if (!target) {
      throw new Error(messages.err_task_definition_unsupported_target);
    }
    const projectUri = Uri.joinPath(Uri.file(wsFolder), project);
    const _tasks: TaskDefinition[] = [];
    if (target === FE_DEPLOY_TRG.ABAP) {
      _tasks.push({
        type: "npm",
        label: `Deploy to ABAP`,
        script: "deploy",
        options: { cwd: `${projectUri.fsPath}` },
      });
    } else {
      // FE_DEPLOY_TRG.CF
      const taskBuild = {
        type: "build.mta",
        label: `Build MTA`,
        taskType: "Build",
        projectPath: `${projectUri.fsPath}`,
        extensions: [],
      };
      const taskDeploy = extend(
        {
          type: "deploy.mta.cf",
          label: `Deploy MTA to Cloud Foundry`,
          taskType: "Deploy",
          mtarPath: `${projectUri.fsPath}/mta_archives/${project || last(split(wsFolder, path.sep))}_0.0.1.mtar`,
          extensions: [],
          dependsOn: [`${taskBuild.label}`],
        },
        await populateCfDetails()
      );

      _tasks.push(taskBuild, taskDeploy);
    }
    return addTaskDefinition(_tasks).then(() => {
      if (target === FE_DEPLOY_TRG.CF) {
        void commands.executeCommand("tasks-explorer.editTask", { command: { arguments: [last(_tasks)] } });
      }
      void commands.executeCommand("tasks-explorer.tree.select", last(_tasks));
    });
  }

  const ui5DeployYaml = waitForResource(
    new RelativePattern(wsFolder, `${project ? `${project}/` : ``}ui5-deploy.yaml`),
    false,
    false,
    true
  );
  await commands.executeCommand(cmd_launch_deploy_config, { fsPath: Uri.joinPath(Uri.file(wsFolder), project).fsPath });
  if (await areResourcesReady([ui5DeployYaml])) {
    await completeTasksDefinition(
      await detectDeployTarget(Uri.joinPath(Uri.file(wsFolder), project, "ui5-deploy.yaml"))
    );
  }
}
