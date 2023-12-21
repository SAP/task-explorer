import { commands } from "vscode";
import {
  HANA_DEPLOYMENT_CONFIG,
  ProjectInfo,
  ProjTypes,
  addTaskDefinition,
  generateMtaDeployTasks,
  isTasksSettled,
} from "./e2e-config";
import { last } from "lodash";

export interface HanaProjectConfigInfo extends ProjectInfo {
  type: string;
}

export async function getHanaE2ePickItems(info: ProjectInfo): Promise<HanaProjectConfigInfo | undefined> {
  if (
    info.style === ProjTypes.HANA &&
    !isTasksSettled(info.wsFolder, await generateMtaDeployTasks(info.wsFolder, info.project, "sequence"))
  ) {
    return { ...info, ...{ type: HANA_DEPLOYMENT_CONFIG } };
  }
}

export async function hanaE2eConfig(data: { wsFolder: string; project: string }): Promise<void> {
  const targetTasks = await generateMtaDeployTasks(data.wsFolder, data.project);
  await addTaskDefinition(data.wsFolder, targetTasks);
  await commands.executeCommand("tasks-explorer.editTask", last(targetTasks));
  void commands.executeCommand("tasks-explorer.tree.select", last(targetTasks));
}
