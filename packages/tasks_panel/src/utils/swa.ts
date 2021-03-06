import { SWATracker } from "@sap/swa-for-sapbas-vsx";

export type ISWATracker = Pick<SWATracker, "track">;

const SWA_NOOP: ISWATracker = {
  track(eventType: string, customEvents?: string[]): void {
    return;
  },
};

let SWA_IMPL = SWA_NOOP;

export function initSWA(newSWA: ISWATracker): void {
  SWA_IMPL = newSWA;
}

export function getSWA(): ISWATracker {
  return SWA_IMPL;
}
