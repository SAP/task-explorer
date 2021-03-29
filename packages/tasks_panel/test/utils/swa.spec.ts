import { expect } from "chai";
import { initSWA, getSWA, ISWATracker } from "../../src/utils/swa";

describe("The global SWATracker utils", () => {
  let orgSWATracker: ISWATracker;
  let trackCalled = false;
  before(() => {
    orgSWATracker = getSWA();
  });

  it("allows setting the global ISWATracker implementation", () => {
    getSWA().track("Hip Hip Hurray");
    expect(trackCalled).to.be.false;

    const testSWATracker: ISWATracker = {
      track() {
        trackCalled = true;
      },
    };
    initSWA(testSWATracker);
    expect(getSWA()).to.equal(testSWATracker);
    getSWA().track("Hello World");
    expect(trackCalled).to.be.true;
  });

  after(() => {
    initSWA(orgSWATracker);
  });
});
