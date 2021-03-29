import { find, get } from "lodash";

function onFrontendReady(taskObject) {
  return async function () {
    await this.rpc.invoke("setTask", [taskObject]);
  };
}

function evaluateMethod(evaluatedQuestions) {
  return async function (params, questionName, methodName) {
    const relevantQuestion = find(evaluatedQuestions, (question) => {
      return get(question, "name") === questionName;
    });
    return await relevantQuestion[methodName].apply(null, params);
  };
}

function executeTask(execDeferred) {
  return async function () {
    execDeferred.resolve();
  };
}

module.exports = {
  onFrontendReady,
  evaluateMethod,
  executeTask,
};
