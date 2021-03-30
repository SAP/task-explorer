import { expect } from "chai";
import { BackendMock } from "../../../local-dev/backend-mock";
import { getAppWrapper } from "../utils";

const pDefer = require("p-defer");
const getPort = require("get-port");

describe("Create Task", () => {
  describe("set selected task", () => {
    context("valid data", () => {
      const tasksObject = [
        {
          intent: "Deploy",
          tasksByIntent: [
            {
              label: "task 1",
              prop1: "prop1a",
              prop2: "prop2",
              taskType: "deploy",
              type: "test-deploy",
            },
          ],
        },
      ];

      let wrapper;
      let backendMock;
      const setTaskDeferred = pDefer();

      before(async () => {
        const port = await getPort({ port: getPort.makeRange(9000, 10000) });
        backendMock = new BackendMock({
          port: port,
          onFrontendReady: async function () {
            await this.rpc.invoke("setTasks", [tasksObject, ""]);
          },
          setSelectedTask: async function (selectedTask) {
            setTaskDeferred.resolve();
            console.log("set selected task: ", selectedTask);
          },
        });

        wrapper = getAppWrapper();
        await wrapper.vm.setupWsRPC(port);
      });

      it("should trigger 'setSelectedTask' when selecting task", async () => {
        const list = wrapper.find(".tasksByIntent");
        await list.setProps({ value: true });
        const task = wrapper.find(".v-list-item__title.selection-task-label");
        await task.trigger("mouseover");
        const button = wrapper.find("#configure");
        await button.trigger("click");
        await setTaskDeferred.promise;
      });

      after(() => {
        backendMock.shutdown();
      });
    });
  });

  describe("Set selected task `Configure` buttons", () => {
    context("valid data", () => {
      const tasksObject = [
        {
          intent: "Deploy",
          tasksByIntent: [
            {
              label: "task 1",
              prop1: "prop1a",
              prop2: "prop2",
              taskType: "deploy",
              type: "test-deploy",
            },
            {
              label: "task 2",
              prop1: "prop1a",
              prop2: "prop2",
              taskType: "deploy",
              type: "test-deploy",
            },
          ],
        },
      ];

      let wrapper;
      let backendMock;

      before(async () => {
        const port = await getPort({ port: getPort.makeRange(9000, 10000) });
        backendMock = new BackendMock({
          port: port,
          onFrontendReady: async function () {
            await this.rpc.invoke("setTasks", [tasksObject, ""]);
          },
        });

        wrapper = getAppWrapper();
        await wrapper.vm.setupWsRPC(port);
      });

      it("should display 'Configured' button only when hovering task", async () => {
        const list = wrapper.find(".tasksByIntent");
        await list.setProps({ value: true });
        const task1 = wrapper
          .findAll(".v-list-item__title.selection-task-label")
          .at(0);
        const button1 = wrapper.findAll("#configure").at(0);
        const button2 = wrapper.findAll("#configure").at(1);
        await task1.trigger("mouseover");
        expect(button1.element.style.display).eql("");
        expect(button2.element.style.display).eql("none");
        await task1.trigger("mouseout");
        expect(button1.element.style.display).eql("none");
        expect(button2.element.style.display).eql("none");
      });

      after(() => {
        backendMock.shutdown();
      });
    });
  });
});
