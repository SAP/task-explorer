import {
  ConfiguredTask,
  TaskEditorContributionAPI,
} from "@vscode-tasks-explorer/task_contrib_types";
import {
  IContributors,
  ITaskTypeEventHandler,
} from "../../src/services/definitions";
import { MockContributor } from "./mockContributor";

export class MockTaskTypeProvider implements IContributors {
  getIntentByType(type: string): string {
    return "abc";
  }

  getExtensionNameByType(type: string): string {
    return "testextension";
  }

  getSupportedIntents(): string[] {
    return ["testIntent"];
  }

  getSupportedTypes(): string[] {
    return ["testType"];
  }

  getTaskEditorContributor(
    type: string
  ): TaskEditorContributionAPI<ConfiguredTask> {
    return new MockContributor();
  }

  async init(): Promise<void> {
    return;
  }

  registerEventHandler(eventHandler: ITaskTypeEventHandler): void {
    return;
  }

  getTaskPropertyDescription(type: string, property: string): string {
    return property;
  }
}
