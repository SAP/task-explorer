const { readFileSync } = require("fs");
const { resolve } = require("path");
const { BackendMock } = require("./backend-mock");

const tasksFilePath = resolve(__dirname, "./tasks-details.json");

/**
 * Websocket Backend mock using a real file (`./tasks-details.json`)
 * This is used as a playground during local development to enable fast feedback loops.
 */

new BackendMock({
  onFrontendReady: async function () {
    const tasksFileText = readFileSync(tasksFilePath, "utf-8");
    const tasksObject = JSON.parse(tasksFileText);
    await this.rpc.invoke("setTasks", [tasksObject, ""]);
  },
  setSelectedTask: async function (selectedTask) {
    console.log("set selected task: ", selectedTask);
  },
});
