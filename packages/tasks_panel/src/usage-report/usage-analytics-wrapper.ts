import { initTelemetrySettings, BASClientFactory, BASTelemetryClient } from "@sap/swa-for-sapbas-vsx";
import * as path from "path";
import { getLogger } from "../logger/logger-wrapper";
import type { ExtensionContext } from "vscode";

type Properties = { [key: string]: string | boolean };

/**
 * A Simple Wrapper for reporting usage analytics
 */
export class AnalyticsWrapper {
  // Event types used by Application Wizard
  private static readonly EVENT_TYPES = {
    TASK_CREATE: "task create initiated",
    TASK_CREATE_SELECTED: "task create selected",
    TASK_CREATE_FINISHED: "task create finished",
    TASK_SAVE: "task save",
    TASK_EXECUTE: "task execute",
    TASK_DELETE: "task delete",
    TASK_DUPLICATE: "task duplicate",
    TASK_TERMINATE: "task terminate",
    TASK_REVEAL: "task show in file",
  };

  /**
   * Note the use of a getter function so the value would be lazy resolved on each use.
   * This enables concise and simple consumption of the tracker throughout our Extension.
   *
   * @returns { Tracker }
   */
  private static getTracker(): BASTelemetryClient {
    return BASClientFactory.getBASTelemetryClient();
  }

  public static createTracker(context: ExtensionContext): void {
    try {
      const packageJson = require(path.join(context.extensionPath, "package.json"));
      const vscodeExtentionFullName = `${packageJson.publisher}.${packageJson.name}`;
      initTelemetrySettings(vscodeExtentionFullName, packageJson.version);
      getLogger().info(`SAP Web Analytics tracker was created for ${vscodeExtentionFullName}`);
    } catch (err: any) {
      getLogger().error(err);
    }
  }

  private static report(eventName: string, properties?: Properties): void {
    // avoid reports for local VSCode environment
    if (process.env.LANDSCAPE_ENVIRONMENT) {
      void AnalyticsWrapper.getTracker()
        .report(eventName, { ...properties })
        .catch((error) => {
          getLogger().error(error, { eventName });
        });
    } else {
      getLogger().trace("SAP Web Analytics tracker was not called because LANDSCAPE_ENVIRONMENT is not set", {
        eventName,
      });
    }
  }

  public static reportTaskCreate(properties?: Properties): void {
    AnalyticsWrapper.report(AnalyticsWrapper.EVENT_TYPES.TASK_CREATE, {
      source: properties ? "contextMenu" : "command",
    });
  }

  public static reportTaskCreateSelected(properties: Properties): void {
    AnalyticsWrapper.report(AnalyticsWrapper.EVENT_TYPES.TASK_CREATE_SELECTED, {
      intent: properties.taskType,
      type: properties.type,
    });
  }

  public static reportTaskCreateFinished(properties: Properties): void {
    AnalyticsWrapper.report(AnalyticsWrapper.EVENT_TYPES.TASK_CREATE_FINISHED, {
      intent: properties.taskType,
      type: properties.type,
    });
  }

  public static reportTaskSave(properties: Properties): void {
    AnalyticsWrapper.report(AnalyticsWrapper.EVENT_TYPES.TASK_SAVE, {
      intent: properties.__intent,
      extensionName: properties.__extensionName,
      type: properties.type,
    });
  }

  public static reportTaskExecuteEditor(properties: Properties): void {
    AnalyticsWrapper.report(AnalyticsWrapper.EVENT_TYPES.TASK_EXECUTE, {
      source: "editor",
      intent: properties.__intent,
      extensionName: properties.__extensionName,
      type: properties.type,
    });
  }

  public static reportTaskExecuteTree(properties: Properties): void {
    AnalyticsWrapper.report(AnalyticsWrapper.EVENT_TYPES.TASK_EXECUTE, {
      source: "tree",
      intent: properties.__intent,
      extensionName: properties.__extensionName,
      type: properties.type,
    });
  }

  public static reportTaskDelete(properties: Properties): void {
    AnalyticsWrapper.report(AnalyticsWrapper.EVENT_TYPES.TASK_DELETE, {
      intent: properties.__intent,
      extensionName: properties.__extensionName,
      type: properties.type,
    });
  }

  public static reportTaskDuplicate(properties: Properties): void {
    AnalyticsWrapper.report(AnalyticsWrapper.EVENT_TYPES.TASK_DUPLICATE, {
      intent: properties.__intent,
      extensionName: properties.__extensionName,
      type: properties.type,
    });
  }

  public static reportTaskExecuteTerminate(properties: Properties): void {
    AnalyticsWrapper.report(AnalyticsWrapper.EVENT_TYPES.TASK_TERMINATE, {
      intent: properties.__intent,
      extensionName: properties.__extensionName,
      type: properties.type,
    });
  }

  public static reportTaskReveal(properties: Properties): void {
    AnalyticsWrapper.report(AnalyticsWrapper.EVENT_TYPES.TASK_REVEAL, {
      intent: properties.__intent,
      extensionName: properties.__extensionName,
      type: properties.type,
    });
  }
}
