import { expect } from "chai";
import { BackendMock } from "../../../local-dev/backend-mock";
import { onFrontendReady } from "./mock-functions";
import { getAppWrapper, getInputWrapperByIndex } from "../utils";

const getPort = require("get-port");

describe("Inquirer Questions Task Form", () => {
  describe("renders the initial data on `onFrontendReady`", () => {
    context("valid data", () => {
      const taskObject = {
        type: "test-deploy",
        label: "test-deploy: task 1",
        taskType: "deploy",
        prop1: "prop1a",
        taskIntent: "Deploy",
        taskImage: "",
        content: [
          {
            name: "prop1",
            message: "Transport package",
            type: "input",
            default: "prop1a",
            validate: "__Function",
          },
        ],
      };

      let wrapper;
      let backendMock;

      before(async () => {
        const port = await getPort({ port: getPort.makeRange(9000, 10000) });
        backendMock = new BackendMock({
          port: port,
          onFrontendReady: onFrontendReady(taskObject),
        });

        wrapper = getAppWrapper();
        await wrapper.vm.setupWsRPC(port);
      });

      it("should send task data from backend", async () => {
        const questionInputWrapper = getInputWrapperByIndex(wrapper, 1);
        expect(questionInputWrapper.element.value).to.equal("prop1a");
      });

      after(() => {
        backendMock.shutdown();
      });
    });
  });
});
