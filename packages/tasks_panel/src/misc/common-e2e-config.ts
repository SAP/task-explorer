import { TaskDefinition } from "vscode";
import {
  CAP_DEPLOYMENT_CONFIG,
  FIORI_DEPLOYMENT_CONFIG,
  HANA_DEPLOYMENT_CONFIG,
  ProjectInfo,
  ProjectTypes,
  collectProjects,
} from "./e2e-config";
import { FioriProjectConfigInfo, fioriE2eConfig, getFioriE2ePickItems } from "./fiori-e2e-config";
import { CapProjectConfigInfo, capE2eConfig, getCapE2ePickItems } from "./cap-e2e-config";
import { HanaProjectConfigInfo, getHanaE2ePickItems, hanaE2eConfig } from "./hana-e2e-config";
import { getLogger } from "../../src/logger/logger-wrapper";
import { compact, reduce } from "lodash";

export type ProjectConfigInfo = FioriProjectConfigInfo | CapProjectConfigInfo | HanaProjectConfigInfo;

export function isDeploymentConfigTask(task: TaskDefinition): boolean {
  return (
    task.type === FIORI_DEPLOYMENT_CONFIG || task.type === HANA_DEPLOYMENT_CONFIG || task.type === CAP_DEPLOYMENT_CONFIG
  );
}
export function completeDeployConfig(task: any): Promise<void> {
  if (task.type === FIORI_DEPLOYMENT_CONFIG) {
    return fioriE2eConfig({ wsFolder: task.wsFolder, project: task.project });
  } else if (task.type === CAP_DEPLOYMENT_CONFIG) {
    return capE2eConfig({ wsFolder: task.wsFolder, project: task.project });
  } else if (task.type === HANA_DEPLOYMENT_CONFIG) {
    return hanaE2eConfig({ wsFolder: task.wsFolder, project: task.project });
  }

  getLogger().debug("completeDeployConfig:: unsupported configuration task type", { type: task.type });
  return Promise.resolve();
}

export async function getConfigDeployPickItems(project: string): Promise<ProjectConfigInfo[]> {
  const items = reduce(
    await collectProjects(project),
    (acc, info: ProjectInfo) => {
      if (info.style === ProjectTypes.FIORI_FE) {
        acc.push(getFioriE2ePickItems(info));
      } else if (info.style === ProjectTypes.CAP) {
        acc.push(getCapE2ePickItems(info));
      } else if (info.style === ProjectTypes.HANA) {
        acc.push(getHanaE2ePickItems(info));
      }
      return acc;
    },
    [] as any[]
  );
  return Promise.all(items).then((items) => compact(items));
}

export function composeDeploymentConfigLabel(type: string): string {
  let project = "Unknown";
  if (type === FIORI_DEPLOYMENT_CONFIG) {
    project = "Fiori";
  } else if (type === CAP_DEPLOYMENT_CONFIG) {
    project = "Full Stack";
  } else if (type === HANA_DEPLOYMENT_CONFIG) {
    project = "Hana";
  }
  return `${project} Configuration`;
}