import { expect } from "chai";
import { BackendMock } from "../../../local-dev/backend-mock";
import { evaluateMethod, onFrontendReady, executeTask } from "./mock-functions";
import { getAppWrapper, getInputWrapperByIndex } from "../utils";

const pDefer = require("p-defer");
const getPort = require("get-port");

describe("Inquirer Questions Task Form", () => {
  describe("execute task flow", () => {
    const evaluatedQuestions = [
      {
        name: "prop1",
        message: "Transport package:",
        type: "input",
        default: "prop1",
        validate: function (value) {
          const pass = value.length > 2;
          if (pass) {
            return true;
          }

          return "invalid value";
        },
      },
    ];

    context("valid data and 'save' button disabled", () => {
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
      const execDeferred = pDefer();

      before(async () => {
        const port = await getPort({ port: getPort.makeRange(9000, 10000) });
        backendMock = new BackendMock({
          port: port,
          onFrontendReady: onFrontendReady(taskObject),
          evaluateMethod: evaluateMethod(evaluatedQuestions),
          executeTask: executeTask(execDeferred),
        });

        wrapper = getAppWrapper();
        await wrapper.vm.setupWsRPC(port);
      });

      it("should enable 'exec' button", async () => {
        const execButton = wrapper.find("#exec");
        execButton.trigger("click");
        expect(execButton.element.disabled).to.be.false;
        await execDeferred.promise;
      });

      after(() => {
        backendMock.shutdown();
      });
    });

    context("valid data and 'save' button enabled", () => {
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
      const answers = { prop1: "prop1a" };
      let wrapper;
      let backendMock;
      const setNewDataDeferred = pDefer();
      const execDeferred = pDefer();

      before(async () => {
        const port = await getPort({ port: getPort.makeRange(9000, 10000) });
        backendMock = new BackendMock({
          port: port,
          onFrontendReady: onFrontendReady(taskObject),
          evaluateMethod: evaluateMethod(evaluatedQuestions),
          executeTask: executeTask(execDeferred),
          async setAnswers(state) {
            answers.prop1 = state.answers.prop1;
            if (state.answers.prop1 === "prop1a-updated") {
              setNewDataDeferred.resolve();
            }
          },
        });

        wrapper = getAppWrapper();
        await wrapper.vm.setupWsRPC(port);
      });

      it("should disable 'exec' button", async () => {
        const questionInputWrapper = getInputWrapperByIndex(wrapper, 1);
        questionInputWrapper.setValue("prop1a-updated");
        await setNewDataDeferred.promise;
        const execButton = wrapper.find("#exec");
        expect(execButton.element.disabled).to.be.true;
      });

      after(() => {
        backendMock.shutdown();
      });
    });

    context("invalid data and 'save' button enabled", () => {
      // `prop1` input is 'xx' and requires input with length > 2
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
            default: "xx",
            validate: "__Function",
          },
        ],
      };
      let wrapper;
      let backendMock;
      const execDeferred = pDefer();

      before(async () => {
        const port = await getPort({ port: getPort.makeRange(9000, 10000) });
        backendMock = new BackendMock({
          port: port,
          onFrontendReady: onFrontendReady(taskObject),
          evaluateMethod: evaluateMethod(evaluatedQuestions),
          executeTask: executeTask(execDeferred),
        });

        wrapper = getAppWrapper();
        await wrapper.vm.setupWsRPC(port);
      });

      it("should disable 'exec' button", async () => {
        // `save` button is disabled when initialize - we skip this step for the test
        wrapper.vm.firstRender = false;
        const execButton = wrapper.find("#exec");
        expect(execButton.element.disabled).to.be.true;
      });

      after(() => {
        backendMock.shutdown();
      });
    });
  });
});
