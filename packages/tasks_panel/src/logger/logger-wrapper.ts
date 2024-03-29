import { ExtensionContext, OutputChannel } from "vscode";
import { resolve } from "path";
import { readFileSync } from "fs";
import {
  getExtensionLogger,
  getExtensionLoggerOpts,
  IChildLogger,
  IVSCodeExtLogger,
  LogLevel,
} from "@vscode-logging/logger";
import { listenToLogSettingsChanges, logLoggerDetails } from "./settings-changes-handler";
import { getLoggingLevelSetting, getSourceLocationTrackingSetting } from "./settings";
import { EMPTY_LOGGER } from "./empty-logger";

/**
 * A Simple Wrapper to hold the state of our "singleton" (per extension) IVSCodeExtLogger
 * implementation.
 */

const PACKAGE_JSON = "package.json";

/**
 * @type {IVSCodeExtLogger}
 */
let logger: IVSCodeExtLogger = EMPTY_LOGGER;

/**
 * @returns { IVSCodeExtLogger }
 */
export function getLogger(): IVSCodeExtLogger {
  return logger;
}

export function getClassLogger(className: string): IChildLogger {
  return getLogger().getChildLogger({ label: className });
}

export function createExtensionLoggerAndSubscribeToLogSettingsChanges(
  context: ExtensionContext,
  outputChannel: OutputChannel,
): void {
  createExtensionLogger(context, outputChannel);
  // Subscribe to Logger settings changes.
  listenToLogSettingsChanges(context);
}

/**
 * This function should be invoked after the Logger has been initialized in the Extension's `activate` function.
 * @param {IVSCodeExtLogger} newLogger
 */
function initLoggerWrapper(newLogger: IVSCodeExtLogger): void {
  logger = newLogger;
}

function createExtensionLogger(context: ExtensionContext, outputChannel: OutputChannel): void {
  const contextLogPath = context.logPath;
  const logLevelSetting: LogLevel = getLoggingLevelSetting();
  const sourceLocationTrackingSettings: boolean = getSourceLocationTrackingSetting();

  const meta = JSON.parse(readFileSync(resolve(context.extensionPath, PACKAGE_JSON), "utf8"));

  const extensionLoggerOpts: getExtensionLoggerOpts = {
    extName: meta.name,
    level: logLevelSetting,
    logPath: contextLogPath,
    sourceLocationTracking: sourceLocationTrackingSettings,
    logConsole: true,
    logOutputChannel: outputChannel,
  };

  // The Logger must first be initialized before any logging commands may be invoked.
  const extensionLogger = getExtensionLogger(extensionLoggerOpts);
  // Update the logger-wrapper with a reference to the extLogger.
  initLoggerWrapper(extensionLogger);
  logLoggerDetails(context, logLevelSetting);
}
