import { RelativePattern, TaskDefinition, Uri, commands } from "vscode";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { getLogger } from "../../src/logger/logger-wrapper";
import {
  CAP_DEPLOYMENT_CONFIG,
  ProjectInfo,
  ProjectTypes,
  addTaskDefinition,
  areResourcesReady,
  getNotRepeatedLabel,
  isFileExist,
  waitForResource,
} from "./e2e-config";
import { last } from "lodash";

export interface CapProjectConfigInfo extends ProjectInfo {
  type: string;
}

function invokeCommand(config: { cmd: string; args: string[]; cwd: string }, additionalArgs: string[]): Promise<void> {
  function executeSpawn(
    config: { cmd: string; args: string[]; cwd: string },
    additionalArgs: string[]
  ): ChildProcessWithoutNullStreams {
    const { args, cmd, cwd } = config;
    return spawn(cmd, [...args, ...additionalArgs], { cwd });
  }

  return new Promise((resolve, reject) => {
    const command = executeSpawn(config, additionalArgs);

    command.stdout.on("data", (data) => {
      getLogger().debug(`${data}`);
    });

    command.stderr.on("data", (data) => {
      getLogger().debug(`${data}`);
    });

    command.on("error", (error) => {
      getLogger().error(error.toString());
      reject(error);
    });

    command.on("exit", (exitCode) => {
      // in case of an error exit code is not 0
      exitCode === 0 ? resolve() : reject();
    });
  });
}

export async function getCapE2ePickItems(info: ProjectInfo): Promise<CapProjectConfigInfo | undefined> {
  async function isCdsAvailable(): Promise<boolean> {
    try {
      await invokeCommand({ cmd: "cds", args: ["help"], cwd: info.wsFolder }, []);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function isConfigRequired(wsFolder: Uri, project: string): Promise<boolean> {
    const projectPath = Uri.joinPath(wsFolder, project);
    const path = Uri.joinPath(projectPath, "mta.yaml");
    return !(await isFileExist(path));
  }

  if (info.style !== ProjectTypes.CAP) {
    return;
  }

  if (await isCdsAvailable()) {
    if (await isConfigRequired(Uri.file(info.wsFolder), info.project)) {
      return Object.assign(info, { type: CAP_DEPLOYMENT_CONFIG });
    }
  }
}

export async function capE2eConfig(wsFolder: string, project: string): Promise<any> {
  const mtaYaml = waitForResource(
    new RelativePattern(wsFolder, `${project ? `${project}/` : ``}mta.yaml`),
    false,
    false,
    true
  );

  async function completeTasksDefinition(): Promise<any> {
    const _tasks: TaskDefinition[] = [];
    _tasks.push({
      type: "npm",
      label: getNotRepeatedLabel(wsFolder, `Deploy CAP`),
      script: "deploy",
      options: { cwd: `${Uri.joinPath(Uri.file(wsFolder), project).fsPath}` },
    });

    return addTaskDefinition(wsFolder, _tasks).then(() => {
      void commands.executeCommand("tasks-explorer.tree.select", last(_tasks));
    });
  }

  await invokeCommand({ cwd: Uri.joinPath(Uri.file(wsFolder), project).fsPath, cmd: "cds", args: ["add", "mta"] }, []);
  if (await areResourcesReady([mtaYaml])) {
    await completeTasksDefinition();
  }
}
