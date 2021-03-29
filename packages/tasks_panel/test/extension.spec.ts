import { expect } from "chai";
import {
  mockVscode,
  MockVSCodeInfo,
  resetTestVSCode,
  testVscode,
} from "./utils/mockVSCode";

mockVscode("src/extension");
import { activate } from "../src/extension";

describe("extension", () => {
  describe("activate method", () => {
    afterEach(() => {
      resetTestVSCode();
    });

    it("registers relevant commands and tasks tree", async () => {
      await activate(testVscode.ExtensionContext);
      expect(MockVSCodeInfo.registeredCommand.has("tasks-explorer.editTask")).to
        .be.true;
      expect(MockVSCodeInfo.registeredCommand.get("tasks-explorer.deleteTask"))
        .to.exist;
      expect(MockVSCodeInfo.registeredCommand.get("tasks-explorer.executeTask"))
        .to.exist;
      expect(MockVSCodeInfo.treeDataProviderRegistered).to.be.true;
    });
  });
});
