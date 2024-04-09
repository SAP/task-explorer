import { expect } from "chai";

describe("The global SWATracker utils", () => {
  const trackCalled = false;
  before(() => {});

  after(() => {});

  it("allows setting the global ISWATracker implementation", () => {
    expect(trackCalled).to.be.false;

    expect(trackCalled).to.be.true;
  });
});
