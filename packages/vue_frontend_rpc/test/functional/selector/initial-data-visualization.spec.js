import { expect } from "chai";
import { BackendMock } from "../../../local-dev/backend-mock";
import { getAppWrapper } from "../utils";

const getPort = require("get-port");

describe("Create Task", () => {
  describe("renders the initial data on `onFrontendReady`", () => {
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

      it("should send task data from backend", async () => {
        const intent = wrapper.find(".intent");
        expect(intent.html()).to.contain("Deploy");
      });

      after(() => {
        backendMock.shutdown();
      });
    });
  });
});
