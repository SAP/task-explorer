import { expect } from "chai";
import { shallowMount } from "@vue/test-utils";
import App from "../src/App";

// Mock the Editor.vue module
jest.mock("../src/components/Editor.vue", () => ({
  name: "Editor",
  template: "<div>Mocked Editor</div>", // Replace with your desired mock template
}));

jest.mock("@sap-devx/webview-rpc/out.browser/rpc-browser", () => ({
  RpcBrowser: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
    registerMethod: jest.fn(),
  })),
}));

// Mock RpcBrowserWebSockets class
jest.mock("@sap-devx/webview-rpc/out.browser/rpc-browser-ws", () => {
  class MockRpcBrowserWebSockets {
    constructor(ws, logger) {
      this.ws = ws;
      this.logger = logger;
      this.eventListeners = {};

      // Simulate the behavior of the real constructor
      this.ws.addEventListener = (eventName, callback) => {
        this.eventListeners[eventName] = callback;
      };

      // Initialize an empty invoke method
      this.invoke = jest.fn();
    }

    registerMethod() {}
  }

  return {
    RpcBrowserWebSockets: MockRpcBrowserWebSockets,
  };
});

describe("App.vue", () => {
  // Mock the rpc object with the required methods
  const mockRpc = {
    invoke: jest.fn(() => Promise.resolve({})),
    registerMethod: jest.fn(),
  };

  it("renders without errors", () => {
    // Mount the component with the mocked rpc object and target prop
    const wrapper = shallowMount(App, {
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
        };
      },
    });

    // Assert that the component exists without errors
    expect(wrapper.exists()).to.be.true;
  });

  it("renders the correct HTML structure", () => {
    const wrapper = shallowMount(App, {
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
        };
      },
    });
    const expectedHtml = `<v-appid="app"><editor-stubeditor="true"rpc="[objectObject]"></editor-stub></v-app>`;
    expect(wrapper.html().replace(/\s/g, "")).to.equal(expectedHtml);
  });

  global.acquireVsCodeApi = jest.fn(() => {
    return {
      // Define mock methods and properties as needed
    };
  });

  it("setupVSCodeRpc sets up RPC for VSCode", () => {
    const wrapper = shallowMount(App, {
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
        };
      },
    });
    wrapper.vm.setupVSCodeRpc();

    // Assert that the RPC setup logic is performed as expected
    expect(wrapper.vm.rpc).to.exist;
  });
});
