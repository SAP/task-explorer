import { RelativePattern, TaskDefinition, Uri, commands, workspace } from "vscode";
import * as Yaml from "yaml";
import * as path from "path";
import { concat, find, includes, last, map, split, extend, isEmpty, size } from "lodash";
import { cfGetTargets, cfGetConfigFileField, DEFAULT_TARGET } from "@sap/cf-tools";
import { getLogger } from "../logger/logger-wrapper";
import { messages } from "../i18n/messages";
import {
  FIORI_DEPLOYMENT_CONFIG,
  ProjectInfo,
  addTaskDefinition,
  areResourcesReady,
  getNotRepeatedLabel,
  isFileExist,
  waitForResource,
} from "./e2e-config";

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

export interface FioriProjectConfigInfo extends ProjectInfo {
  type: string;
}

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

export async function getFioriE2ePickItems(info: ProjectInfo): Promise<FioriProjectConfigInfo | undefined> {
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

  async function isCommandRegistered(command: string): Promise<boolean> {
    return commands.getCommands().then((allCommands) => {
      return allCommands.includes(command);
    });
  }

  // start analyzing when the corresponding generator command exists and is registered in devspace, otherwise the config e2e deployment option should not be displayed
  if (await isCommandRegistered(cmd_launch_deploy_config)) {
    if (await isConfigRequired(Uri.file(info.wsFolder), info.project)) {
      return Object.assign(info, { type: FIORI_DEPLOYMENT_CONFIG });
    }
  }
}

export async function fioriE2eConfig(wsFolder: string, project: string): Promise<any> {
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
        label: getNotRepeatedLabel(wsFolder, `Deploy to ABAP`),
        script: "deploy",
        options: { cwd: `${projectUri.fsPath}` },
      });
    } else {
      // FE_DEPLOY_TRG.CF
      const taskBuild = {
        type: "build.mta",
        label: getNotRepeatedLabel(wsFolder, `Build MTA`),
        taskType: "Build",
        projectPath: `${projectUri.fsPath}`,
        extensions: [],
      };
      const taskDeploy = extend(
        {
          type: "deploy.mta.cf",
          label: getNotRepeatedLabel(wsFolder, `Deploy MTA to Cloud Foundry`),
          taskType: "Deploy",
          mtarPath: `${projectUri.fsPath}/mta_archives/${project || last(split(wsFolder, path.sep))}_0.0.1.mtar`,
          extensions: [],
          dependsOn: [`${taskBuild.label}`],
        },
        await populateCfDetails()
      );

      _tasks.push(taskBuild, taskDeploy);
    }
    return addTaskDefinition(wsFolder, _tasks).then(() => {
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
