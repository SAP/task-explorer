import { GlobPattern, TaskDefinition, Uri, extensions, workspace } from "vscode";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";
import { Dictionary, compact, concat, extend, find, includes, isEmpty, last, size, split } from "lodash";
import { getUniqueTaskLabel, updateTasksConfiguration } from "../../src/utils/task-serializer";
import { DEFAULT_TARGET, cfGetConfigFileField, cfGetTargets } from "@sap/cf-tools";
import { getLogger } from "../../src/logger/logger-wrapper";
import * as path from "path";

// export const PROJECT_TYPES = {
//     CAP_PROJ: "com.sap.cap",
//     CAP_JAVA_PROJ: "com.sap.cap.java",
//     BAS_PROJ: "com.sap.bas.empty",
//     FIORI_FE_PROJ: "com.sap.fe",
//     FIORI_PROJ: "com.sap.ui",
//     LCAP_PROJ: "com.sap.lcap",
//   };

export enum ProjectTypes {
  FIORI_FE,
  CAP,
  LCAP,
  HANA,
}

type CfDetails = {
  cfTarget: string;
  cfEndpoint: string;
  cfOrg: string;
  cfSpace: string;
};

export const FIORI_DEPLOYMENT_CONFIG = "fioriDeploymentConfig";
export const CAP_DEPLOYMENT_CONFIG = "capDeploymentConfig";
export const HANA_DEPLOYMENT_CONFIG = "hanaDeploymentConfig";

export interface ProjectInfo {
  wsFolder: string;
  project: string;
  style: ProjectTypes;
}

export async function waitForResource(
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
export async function areResourcesReady(promises: Promise<boolean>[], timeout = 5): Promise<boolean> {
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

export async function collectProjects(wsFolder: string): Promise<ProjectInfo[]> {
  function asWsRelativePath(absPath: string): string {
    let project = workspace.asRelativePath(absPath, false);
    if (project === absPath) {
      project = ""; // single root
    }
    return project;
  }

  const items: Promise<ProjectInfo | undefined>[] = [];
  const requestedFolder = Uri.file(wsFolder);
  const btaExtension: any = extensions.getExtension("SAPOSS.app-studio-toolkit");
  const basToolkitAPI: BasToolkit = btaExtension?.exports;
  const workspaceAPI = basToolkitAPI?.workspaceAPI ?? { getProjects: () => Promise.resolve([]) };

  for (const project of await workspaceAPI.getProjects()) {
    items.push(
      project.getProjectInfo().then((info) => {
        if (info) {
          const workspaceFolder = workspace.getWorkspaceFolder(Uri.file(info.path));
          if (workspaceFolder?.uri.fsPath.startsWith(requestedFolder.fsPath)) {
            let style: ProjectTypes | undefined;
            if (info.type === "com.sap.fe") {
              style = ProjectTypes.FIORI_FE;
            } else if (/^com\.sap\.cap(\.java)?$/.test(info.type)) {
              style = ProjectTypes.CAP;
            } else if (info.type === "cpm.sap.lcap") {
              style = ProjectTypes.LCAP;
            } else if (info.type === "cpm.sap.hana") {
              style = ProjectTypes.HANA;
            }
            if (style !== undefined) {
              return {
                wsFolder,
                project: asWsRelativePath(info.path),
                style,
              };
            }
          }
        }
      })
    );
  }
  return Promise.all(items).then((items) => compact(items));
}

export async function addTaskDefinition(wsFolder: string, tasks: TaskDefinition[]): Promise<any> {
  return updateTasksConfiguration(
    wsFolder,
    concat(workspace.getConfiguration("tasks", Uri.file(wsFolder)).get("tasks") ?? [], tasks)
  );
}

export async function isFileExist(uri: Uri): Promise<boolean> {
  try {
    return !!(await workspace.fs.stat(uri));
  } catch (e) {
    return false;
  }
}

export async function generateMtaDeployTasks(wsFolder: string, project: string): Promise<TaskDefinition[]> {
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
  const projectUri = Uri.joinPath(Uri.file(wsFolder), project);
  const taskBuild = {
    type: "build.mta",
    label: getUniqueTaskLabel(`Build MTA`),
    taskType: "Build",
    projectPath: `${projectUri.fsPath}`,
    extensions: [],
  };
  const taskDeploy = extend(
    {
      type: "deploy.mta.cf",
      label: getUniqueTaskLabel(`Deploy MTA to Cloud Foundry`),
      taskType: "Deploy",
      mtarPath: `${projectUri.fsPath}/mta_archives/${project || last(split(wsFolder, path.sep))}_0.0.1.mtar`,
      extensions: [],
      dependsOn: [`${taskBuild.label}`],
    },
    await populateCfDetails()
  );

  return [taskBuild, taskDeploy];
}
