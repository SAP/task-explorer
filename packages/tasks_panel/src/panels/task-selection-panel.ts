import { WebviewPanel } from "vscode";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { AppEvents } from "../app-events";
import { VSCodeEvents } from "../vscode-events";
import { AbstractWebviewPanel } from "./abstract-webview-panel";
import { TasksSelection } from "../tasks-selection";

const TASK_SELECTION_VIEW_TYPE = "Task Selection";

export interface SelectionPanelState {
  tasks: ConfiguredTask[];
}

export class TaskSelectionPanel extends AbstractWebviewPanel<SelectionPanelState> {
  public constructor(tasks: ConfiguredTask[], readResource: (file: string) => Promise<string>) {
    super(readResource);
    this.viewType = TASK_SELECTION_VIEW_TYPE;
    this.focusedKey = "tasksSelection.Focused";
    this.loadWebviewPanel({
      tasks: tasks,
    });
  }

  public setWebviewPanel(webviewPanel: WebviewPanel, state: SelectionPanelState): void {
    this.webViewPanel = webviewPanel;
    this.webViewPanel.title = "Create Task";
    this.state = state;
    const rpc = new RpcExtension(this.webViewPanel.webview);
    const vscodeEvents: AppEvents = new VSCodeEvents(this.webViewPanel);
    new TasksSelection(rpc, vscodeEvents, state.tasks, this.readResource);
  }
}
