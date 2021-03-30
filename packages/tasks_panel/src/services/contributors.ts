import { commands, Extension, extensions } from "vscode";
import { get, keys, map, uniq, zipObject } from "lodash";
import {
  ConfiguredTask,
  TaskEditorContributionAPI,
} from "@vscode-tasks-explorer/task_contrib_types";
import { getLogger } from "../logger/logger-wrapper";
import { ITaskTypeEventHandler, IContributors } from "./definitions";
import { messages } from "../i18n/messages";

export class Contributors implements IContributors {
  private readonly eventHandlers: ITaskTypeEventHandler[] = [];
  private readonly tasksEditorContributorsMap = new Map<string, any>();
  private static instance: IContributors | undefined;

  public static readonly TASKS_EXPLORER_EXTENSION_ID =
    "sapse.vscode-tasks-explorer-tasks-panel";

  private constructor() {
    return;
  }

  public static getInstance(): IContributors {
    if (Contributors.instance === undefined) {
      Contributors.instance = new Contributors();
    }
    return Contributors.instance;
  }

  getIntentByType(type: string): string {
    const intent = this.tasksEditorContributorsMap.get(type)?.intent;
    return intent ?? "other";
  }

  getExtensionNameByType(type: string): string {
    return this.tasksEditorContributorsMap.get(type)?.extensionName;
  }

  getSupportedIntents(): string[] {
    const supportedTypes = Array.from(this.tasksEditorContributorsMap.keys());
    return uniq(map(supportedTypes, (_) => this.getIntentByType(_)));
  }

  getSupportedTypes(): string[] {
    return Array.from(this.tasksEditorContributorsMap.keys());
  }

  public registerEventHandler(eventHandler: ITaskTypeEventHandler): void {
    this.eventHandlers.push(eventHandler);
  }

  public getTaskEditorContributor(
    type: string
  ): TaskEditorContributionAPI<ConfiguredTask> {
    return this.tasksEditorContributorsMap.get(type)?.provider;
  }

  private async getApi(extension: Extension<any>, extensionId: string) {
    let api: any;
    if (!extension.isActive) {
      try {
        api = await extension.activate();
      } catch (error) {
        getLogger().error(messages.ACTIVATE_CONTRIB_EXT_ERROR(extensionId));
      }
    } else {
      api = extension.exports;
    }
    return api;
  }

  public async init(): Promise<void> {
    const allExtensions: readonly Extension<any>[] = extensions.all;
    let isPanelVisible = false;
    for (const extension of allExtensions) {
      const currentPackageJSON: any = get(extension, "packageJSON");
      const extensionName: string = get(currentPackageJSON, "name");
      const extensionPublisher: string = get(currentPackageJSON, "publisher");
      const extensionId = `${extensionPublisher}.${extensionName}`;
      const contributedTypes = this.getTypesInfo(currentPackageJSON);
      if (contributedTypes.size === 0) {
        continue;
      }
      const api = await this.getApi(extension, extensionId);
      if (
        api === undefined ||
        typeof api.getTaskEditorContributors !== "function"
      ) {
        continue;
      }

      const tasksPropertyMessageMap = this.getTasksPropertyMessageMap(
        currentPackageJSON
      );

      const taskProviders = api.getTaskEditorContributors();
      taskProviders.forEach((provider: any, type: string) => {
        const typeInfo = contributedTypes.get(type);
        if (typeInfo === undefined) {
          getLogger().error(messages.MISSING_TYPE(type));
          return;
        }
        if (this.tasksEditorContributorsMap.has(type)) {
          getLogger().error(messages.DUPLICATED_TYPE(type));
        } else {
          this.tasksEditorContributorsMap.set(type, {
            provider: provider,
            intent: typeInfo["intent"],
            extensionName: extensionName,
            properties: tasksPropertyMessageMap[type],
          });
          isPanelVisible = true;
        }
      });
    }
    commands.executeCommand(
      "setContext",
      "is-task-explorer-view-visible",
      isPanelVisible
    );
    for (const eventHandler of this.eventHandlers) {
      eventHandler.onChange();
    }
  }

  private getTasksPropertyMessageMap(
    packageJSON: any
  ): Record<string, Record<string, string>> {
    const contributions = get(packageJSON, "contributes");
    const tasksDefinitions = get(contributions, "taskDefinitions");

    const tasksTypes = map(tasksDefinitions, (_) => _.type);
    const tasksProperties = map(tasksDefinitions, (taskDefinition) => {
      const propertiesNames: string[] = keys(taskDefinition.properties);
      const propertiesDescriptions: string[] = map(
        propertiesNames,
        (_) => taskDefinition.properties[_].description
      );
      return zipObject(propertiesNames, propertiesDescriptions);
    });
    return zipObject(tasksTypes, tasksProperties);
  }

  private getTypesInfo(packageJSON: Record<string, any>): Map<string, any> {
    const info = new Map();
    const tasksExplorerContribution = packageJSON.BASContributes?.tasksExplorer;
    if (tasksExplorerContribution !== undefined) {
      for (const typeInfo of tasksExplorerContribution) {
        info.set(typeInfo["type"], typeInfo);
      }
    }
    return info;
  }

  getTaskPropertyDescription(type: string, property: string): string {
    return this.tasksEditorContributorsMap.get(type).properties[property];
  }
}
