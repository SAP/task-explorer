import { ExtensionContext, tasks } from "vscode";
import { ConfiguredTask, TaskEditorContributorExtensionAPI } from "@sap_oss/task_contrib_types";
import { NPM_TYPE } from "./definitions";
// import { NpmTaskProvider } from "./npm-task-provider";
import { TaskExplorerContributor } from "./npm-task-explorer-contributor";

export function activate(context: ExtensionContext): TaskEditorContributorExtensionAPI<ConfiguredTask> {
  // extension that contributes to Tasks Explorer has to provide:
  // 1. Task Provider
  // tasks.registerTaskProvider(NPM_TYPE, new NpmTaskProvider());

  // 2. Task Contributors
  return {
    getTaskEditorContributors(): Map<string, TaskExplorerContributor> {
      const contributors = new Map<string, TaskExplorerContributor>();
      contributors.set(NPM_TYPE, new TaskExplorerContributor(context.extensionPath));
      return contributors;
    },
  };
}
