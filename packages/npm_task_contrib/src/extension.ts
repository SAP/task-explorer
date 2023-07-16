import { ExtensionContext } from "vscode";
import { ConfiguredTask, TaskEditorContributorExtensionAPI } from "@sap_oss/task_contrib_types";
import { NPM_TYPE } from "./definitions";
import { TaskExplorerContributor } from "./npm-contributor";

export function activate(context: ExtensionContext): TaskEditorContributorExtensionAPI<ConfiguredTask> {
  // extension that contributes to Tasks Explorer has to provide:
  // 1. Task Provider
  // use the builtin vscode mpm tasks provider

  // 2. Task Contributors
  return {
    getTaskEditorContributors(): Map<string, TaskExplorerContributor> {
      const contributors = new Map<string, TaskExplorerContributor>();
      contributors.set(NPM_TYPE, new TaskExplorerContributor(context.extensionPath));
      return contributors;
    },
  };
}
