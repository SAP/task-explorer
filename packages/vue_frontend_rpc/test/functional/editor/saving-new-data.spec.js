import { expect } from "chai";
import { BackendMock } from "../../../local-dev/backend-mock";
import { evaluateMethod, onFrontendReady } from "./mock-functions";
import { getAppWrapper, getInputWrapperByIndex } from "../utils";

const pDefer = require("p-defer");
const getPort = require("get-port");

describe("Inquirer Questions Task Form", () => {
  describe("saving new data flow", () => {
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

      const answers = { prop1: "prop1a" };
      let wrapper;
      let backendMock;
      const saveDeferred = pDefer();
      const setNewDataDeferred = pDefer();

      before(async () => {
        const port = await getPort({ port: getPort.makeRange(9000, 10000) });
        backendMock = new BackendMock({
          port: port,
          onFrontendReady: onFrontendReady(taskObject),
          evaluateMethod: evaluateMethod(evaluatedQuestions),
          async saveTask() {
            taskObject.prop1 = answers.prop1;
            saveDeferred.resolve();
          },
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

      it("should send new answers data to backend", async () => {
        // `save` button is disabled when initialize - we skip this step for the test
        wrapper.vm.firstRender = false;
        const questionInputWrapper = getInputWrapperByIndex(wrapper, 1);
        questionInputWrapper.setValue("prop1a-updated");
        await setNewDataDeferred.promise;
        const saveButton = wrapper.find("#save");
        saveButton.trigger("click");
        await saveDeferred.promise;
        expect(taskObject.prop1).to.equal("prop1a-updated");
      });

      after(() => {
        backendMock.shutdown();
      });
    });

    context("invalid data", () => {
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

      before(async () => {
        const port = await getPort({ port: getPort.makeRange(9000, 10000) });
        backendMock = new BackendMock({
          port: port,
          onFrontendReady: onFrontendReady(taskObject),
          evaluateMethod: evaluateMethod(evaluatedQuestions),
        });

        wrapper = getAppWrapper();
        await wrapper.vm.setupWsRPC(port);
      });

      it("should disable 'save' button", async () => {
        // `save` button is disabled when initialize - we skip this step for the test
        wrapper.vm.firstRender = false;
        const saveButton = wrapper.find("#save");
        expect(saveButton.element.disabled).to.be.true;
      });

      after(() => {
        backendMock.shutdown();
      });
    });

    context("initialize with valid data", () => {
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
          evaluateMethod: evaluateMethod(evaluatedQuestions),
        });

        wrapper = getAppWrapper();
        await wrapper.vm.setupWsRPC(port);
      });

      it("'save' button should be disabled'", async () => {
        const saveButton = wrapper.find("#save");
        expect(saveButton.element.disabled).to.be.true;
      });

      after(() => {
        backendMock.shutdown();
      });
    });
  });
});
