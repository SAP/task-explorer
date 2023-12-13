import { commands } from "vscode";
import {
  HANA_DEPLOYMENT_CONFIG,
  LabelType,
  ProjectInfo,
  ProjectTypes,
  addTaskDefinition,
  generateMtaDeployTasks,
  isTasksSettled,
} from "./e2e-config";
import { last } from "lodash";

export interface HanaProjectConfigInfo extends ProjectInfo {
  type: string;
}

export async function getHanaE2ePickItems(info: ProjectInfo): Promise<HanaProjectConfigInfo | undefined> {
  if (info.style !== ProjectTypes.HANA) {
    return;
  }
  if (!isTasksSettled(info.wsFolder, await generateMtaDeployTasks(info.wsFolder, info.project, LabelType.sequence))) {
    return Object.assign(info, { type: HANA_DEPLOYMENT_CONFIG });
  }
}

export async function hanaE2eConfig(data: { wsFolder: string; project: string }): Promise<void> {
  const _tasks = await generateMtaDeployTasks(data.wsFolder, data.project);
  return addTaskDefinition(data.wsFolder, _tasks).then(async () => {
    return commands.executeCommand("tasks-explorer.editTask", last(_tasks)).then(() => {
      return commands.executeCommand("tasks-explorer.tree.select", last(_tasks));
    });
  });
}
