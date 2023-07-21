import { expect } from "chai";
import { mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "./utils/mockVSCode";

mockVscode("src/extension");
import { activate } from "../src/extension";
import { find, size } from "lodash";
import { mock } from "sinon";

describe("extension", () => {
  describe("activate method", () => {
    afterEach(() => {
      resetTestVSCode();
    });

    it("registers relevant commands and tasks tree", async () => {
      await activate(testVscode.ExtensionContext);
      expect(MockVSCodeInfo.registeredCommand.has("tasks-explorer.editTask")).to.be.true;
      expect(MockVSCodeInfo.registeredCommand.get("tasks-explorer.deleteTask")).to.exist;
      expect(MockVSCodeInfo.registeredCommand.get("tasks-explorer.executeTask")).to.exist;
      expect(MockVSCodeInfo.registeredCommand.get("tasks-explorer.tree.refresh")).to.exist;
      expect(MockVSCodeInfo.treeDataProvider.get("tasksPanel")).to.exist;
    });

    it("verify 'refresh' callback configured", async () => {
      await activate(testVscode.ExtensionContext);
      const mockTreeProvider = mock(MockVSCodeInfo.treeDataProvider.get("tasksPanel"));
      mockTreeProvider.expects("onChange").resolves();
      MockVSCodeInfo.registeredCommand.get("tasks-explorer.tree.refresh")();
    });
  });

  describe("package definitions", () => {
    let packageJson: {
      contributes: {
        viewsWelcome: {
          when: string;
          contents: string;
          view: string;
        }[];
      };
    };

    before(() => {
      packageJson = require("../../package.json");
    });

    it("extension pack contributes viewsWelcome verifing", () => {
      const tasksWelcome = packageJson.contributes.viewsWelcome[0];
      expect(tasksWelcome.when).to.be.equal("ext.isNoTasksFound");
      expect(tasksWelcome.view).to.be.equal("tasksPanel");
      const contents = tasksWelcome.contents.split("\n");
      expect(size(contents)).to.be.gte(3);
      expect(
        find(contents, (line) =>
          /\[.*\]\(https:\/\/help.sap.com\/docs\/bas\/sap-business-application-studio\/task-explorer\?version=Cloud\)/.test(
            line
          )
        )
      ).to.be.ok;
      expect(find(contents, (line) => /\[.*\]\(command:tasks-explorer.createTask\)/.test(line))).to.be.ok;
    });
  });
});
