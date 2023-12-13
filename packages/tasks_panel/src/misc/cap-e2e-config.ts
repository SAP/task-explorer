import { RelativePattern, Uri, commands } from "vscode";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { getLogger } from "../../src/logger/logger-wrapper";
import {
  CAP_DEPLOYMENT_CONFIG,
  LabelType,
  ProjectInfo,
  ProjectTypes,
  addTaskDefinition,
  areResourcesReady,
  generateMtaDeployTasks,
  isFileExist,
  isTasksSettled,
  waitForResource,
} from "./e2e-config";
import { last } from "lodash";

export interface CapProjectConfigInfo extends ProjectInfo {
  type: string;
}

/* istanbul ignore next */
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
    return invokeCommand({ cmd: "cds", args: ["help"], cwd: info.wsFolder }, [])
      .then(() => true)
      .catch(() => false);
  }

  async function isConfigured(): Promise<boolean> {
    return (
      (await isFileExist(Uri.joinPath(Uri.file(info.wsFolder), info.project, "mta.yaml"))) &&
      isTasksSettled(info.wsFolder, await generateMtaDeployTasks(info.wsFolder, info.project, LabelType.sequence))
    );
  }

  if (info.style !== ProjectTypes.CAP) {
    return;
  }

  if (await isCdsAvailable()) {
    if (!(await isConfigured())) {
      return Object.assign(info, { type: CAP_DEPLOYMENT_CONFIG });
    }
  }
}

export async function capE2eConfig(data: { wsFolder: string; project: string }): Promise<void> {
  let mtaYaml = Promise.resolve(true);
  if (!(await isFileExist(Uri.joinPath(Uri.file(data.wsFolder), data.project, "mta.yaml")))) {
    mtaYaml = waitForResource(
      new RelativePattern(data.wsFolder, `${data.project ? `${data.project}/` : ``}mta.yaml`),
      false,
      false,
      true
    );
    await invokeCommand(
      { cwd: Uri.joinPath(Uri.file(data.wsFolder), data.project).fsPath, cmd: "cds", args: ["add", "mta"] },
      []
    );
  }
  if (await areResourcesReady([mtaYaml])) {
    const _tasks = await generateMtaDeployTasks(data.wsFolder, data.project);
    return addTaskDefinition(data.wsFolder, _tasks).then(async () => {
      return commands.executeCommand("tasks-explorer.editTask", last(_tasks)).then(() => {
        return commands.executeCommand("tasks-explorer.tree.select", last(_tasks));
      });
    });
  }
}
