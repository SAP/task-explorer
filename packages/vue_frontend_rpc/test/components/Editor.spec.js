import Editor from "../../src/components/Editor.vue";
import { expect } from "chai";
import { mount, shallowMount } from "@vue/test-utils";

jest.spyOn(window, "getComputedStyle").mockImplementation(() => ({
  getPropertyValue: (property) => {
    if (property === "--vscode-descriptionForeground") {
      return "#717171"; // Mock the CSS variable value
    }
    return "";
  },
}));

jest.mock("@sap-devx/inquirer-gui-file-browser-plugin", () => ({
  FileBrowserPlugin: jest.fn(() => ({
    register: jest.fn(),
  })),
}));

jest.mock("@sap-devx/inquirer-gui-folder-browser-plugin", () => ({
  FolderBrowserPlugin: jest.fn(() => ({
    register: jest.fn(),
  })),
}));

jest.mock("@sap-devx/inquirer-gui-label-plugin", () => ({
  LabelPlugin: jest.fn(() => ({
    register: jest.fn(),
  })),
}));

describe("Editor.vue", () => {
  it("renders without errors", () => {
    const wrapper = mount(Editor);
    expect(wrapper.exists()).to.be.true;
  });

  it("renders the correct HTML structure set editor false", () => {
    const wrapper = mount(Editor);
    const expectedHtml = `<!--v-if-->`;
    expect(wrapper.html().replace(/\s/g, "")).to.equal(expectedHtml);
  });

  it("renders the correct HTML structure set editor true", () => {
    const wrapper = shallowMount(Editor, {
      props: {
        editor: true,
        rpc: {},
      },
    });
    const expectedHtml = `<v-mainid="editor-component"><!--<v-row>--><!--<v-col>--><!--<Formref="form":questions="questions"@answered="onAnswered"/>--><!--</v-col>--><!--</v-row>--><v-rowclass="main-rowma-0pa-0"><v-colclass="main-colma-0pa-0"><v-cardclass="main-cardmr-16pb-2"><v-card-titleclass="task-intro"><v-imgclass="task-icon"style="display:none;"></v-img><divclass="task-label"></div><v-spacer></v-spacer><div><v-dividervertical=""inset=""></v-divider><v-btnid="exec"text=""tile=""disabled="true"><divclass="exec-title"></div><divstyle="mask-image:url(undefined);webkit-mask-image:url(undefined);"class="exec-icon"></div></v-btn></div></v-card-title><v-divider></v-divider><v-list-groupclass="my-list-group"sub-group=""prepend-icon="$expand"value="true"></v-list-group><formquestions=""></form></v-card></v-col></v-row><v-dividerclass="mr-16"></v-divider><v-rowstyle="height:4rem;"class="mr-16"sm="auto"><v-colclass="bottom-buttons-col"style="display:flex;align-items:center;"><v-btnid="save"disabled="true">Save</v-btn></v-col></v-row></v-main>`;
    expect(wrapper.html().replace(/\s/g, "")).to.equal(expectedHtml);
    expect(wrapper.exists()).to.be.true;
  });

  it("correctly handles 'onAnswered' method", async () => {
    // Mount the component
    const wrapper = mount(Editor, {
      props: {
        editor: true,
        rpc: {}, // Provide any required props here
      },
    });

    // Define initial state for testing
    wrapper.setData({
      state: {
        inputValid: true,
        saveEnabled: true,
        firstRender: true,
      },
    });

    // Create sample data for the 'answers' and 'issues' parameters
    const sampleAnswers = { label: "Sample Label" };
    const sampleIssues = undefined;

    // Call the 'onAnswered' method with the sample data
    await wrapper.vm.onAnswered(sampleAnswers, sampleIssues);

    // Assert that the 'state' properties have been updated correctly
    expect(wrapper.vm.state.inputValid).to.equal(true);
    expect(wrapper.vm.state.saveEnabled).to.equal(false);
    expect(wrapper.vm.state.firstRender).to.equal(false);
  });

  it("correctly handles 'onSave' method", async () => {
    // Mount the component
    const wrapper = mount(Editor, {
      props: {
        editor: true,
        rpc: {},
      },
    });

    // Mock the 'rpc' object and its 'invoke' method
    const mockRpc = {
      invoke: jest.fn(),
    };

    // Set the 'rpc' object in the component's data
    wrapper.setData({
      rpc: mockRpc,
      state: {
        saveEnabled: true,
      },
    });

    // Call the 'onSave' method
    await wrapper.vm.onSave();

    // Assert that the 'saveEnabled' state has been correctly updated
    expect(wrapper.vm.state.saveEnabled).to.be.false;
  });
});
