import { IVSCodeExtLogger, IChildLogger } from "@vscode-logging/logger";

export const EMPTY_LOGGER: IVSCodeExtLogger = {
  /* eslint-disable @typescript-eslint/no-empty-function -- NOOP */
  changeLevel(newLevel: string): void {},
  changeSourceLocationTracking(newSourceLocation: boolean): void {},
  debug(msg: string, ...args: any[]): void {},
  error(msg: string, ...args: any[]): void {},
  fatal(msg: string, ...args: any[]): void {},
  getChildLogger(opts: { label: string }): IChildLogger {
    return this;
  },
  info(msg: string, ...args: any[]): void {},
  trace(msg: string, ...args: any[]): void {},
  warn(msg: string, ...args: any[]): void {},
  /* eslint-enable @typescript-eslint/no-empty-function -- NOOP */
};

Object.freeze(EMPTY_LOGGER);
