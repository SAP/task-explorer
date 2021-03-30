import Vuetify from "vuetify";
import { mount, createLocalVue } from "@vue/test-utils";
import Form from "@sap-devx/inquirer-gui";
import App from "@/App.vue";

function getAppWrapper() {
  global.requestAnimationFrame = (cb) => cb();
  const localVue = createLocalVue();
  const vuetifyInstance = new Vuetify();
  localVue.use(Form, { vuetify: vuetifyInstance });
  const wrapper = mount(App, {
    localVue: localVue,
    vuetify: vuetifyInstance,
  });

  return wrapper;
}

function getInputWrapperByIndex(wrapper, taskIndex) {
  // we assume that the structure of the HTML that inquirer-gui produces is in the following format:
  // 1st --> is 1st question input, 3rd is 2nd question input ...
  const indexInWrapper = 2 * taskIndex - 1;
  const superDivOfParentWrapper = wrapper.find(
    `form:nth-child(${indexInWrapper})`
  );
  const questionInputWrapper = superDivOfParentWrapper.find("input");
  return questionInputWrapper;
}

module.exports = {
  getAppWrapper,
  getInputWrapperByIndex,
};
