import { expect } from "chai";
import { ConfiguredTask, TaskEditorContributionAPI } from "@sap_oss/task_contrib_types";
import { AppEvents } from "../../src/app-events";
import { MockContributor, MockContributorWithOnSave } from "./mockContributor";

export class MockAppEvents implements AppEvents {
  public saveCalled = false;
  public executeCalled = false;
  public createCalled = false;

  async executeTask(task: any): Promise<void> {
    expectTaskHasNoTechnicalFields(task);
    this.executeCalled = true;
  }

  getTasksEditorContributor(type: string): TaskEditorContributionAPI<ConfiguredTask> | undefined {
    switch (type) {
      case "testType":
        return new MockContributor();
      case "extendedTestType":
        return new MockContributorWithOnSave();
      default:
        return undefined;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppressed: test scope
  async updateTaskInConfiguration(path: string, task: ConfiguredTask, index: number): Promise<void> {
    expectTaskHasNoTechnicalFields(task);
    this.saveCalled = true;
  }

  async addTaskToConfiguration(path: string, task: ConfiguredTask): Promise<number> {
    expectTaskHasNoTechnicalFields(task);
    this.createCalled = true;
    return 0;
  }

  getTaskPropertyDescription(type: string, property: string): string {
    return property;
  }
}

function expectTaskHasNoTechnicalFields(task: ConfiguredTask | undefined) {
  expect(task).exist;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppressed: test scope
  const keys = Object.keys(task!);
  for (const key of keys) {
    expect(key).not.contains("__");
  }
}
