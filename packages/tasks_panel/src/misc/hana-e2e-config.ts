import { TaskDefinition, Uri, commands, workspace } from "vscode";
import {
  HANA_DEPLOYMENT_CONFIG,
  ProjectInfo,
  ProjectTypes,
  addTaskDefinition,
  generateMtaDeployTasks,
} from "./e2e-config";
import { find, isMatch, last, reduce } from "lodash";

export interface HanaProjectConfigInfo extends ProjectInfo {
  type: string;
}

export async function getHanaE2ePickItems(info: ProjectInfo): Promise<HanaProjectConfigInfo | undefined> {
  function isConfigRequired(_tasks: TaskDefinition[]): boolean {
    const tasks: TaskDefinition[] = workspace.getConfiguration("tasks", Uri.file(info.wsFolder)).get("tasks") ?? [];
    return !reduce(
      _tasks,
      (acc, task) => {
        acc =
          acc &&
          !!find(tasks, (_) => {
            return isMatch(_, task);
          });
        return acc;
      },
      true
    );
  }

  if (info.style !== ProjectTypes.HANA) {
    return;
  }
  if (isConfigRequired(await generateMtaDeployTasks(info.wsFolder, info.project))) {
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
