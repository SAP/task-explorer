import { join, sep } from "path";
import { WebviewPanel, window, ViewColumn, Uri, commands } from "vscode";
import { getExtensionPath } from "../extension";

export abstract class AbstractWebviewPanel<T> {
  public viewType = "";
  protected mediaPath: string;
  protected viewTitle = "";
  protected webViewPanel: WebviewPanel | undefined;
  protected focusedKey = "";
  protected htmlFileName: string;
  protected state: any;

  protected constructor(
    protected readonly readResource: (file: string) => Promise<string>
  ) {
    this.mediaPath = join(getExtensionPath(), "dist", "media");
    this.htmlFileName = "index.html";
  }

  protected abstract setWebviewPanel(
    webviewPanel: WebviewPanel,
    state?: T
  ): void;

  public loadWebviewPanel(state?: T): void {
    if (this.webViewPanel) {
      this.dispose();
    }
    const webViewPanel = window.createWebviewPanel(
      this.viewType,
      this.viewTitle,
      ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,
        localResourceRoots: [Uri.file(this.mediaPath)],
      }
    );
    this.setWebviewPanel(webViewPanel, state);
  }

  public async initWebviewPanel(): Promise<void> {
    // Set the webview's initial html content
    await this.initHtmlContent();

    if (this.webViewPanel === undefined) {
      return;
    }

    // Set the context (current panel is focused)
    this.setFocused(this.webViewPanel.active);

    // Update the content based on view changes
    this.webViewPanel.onDidChangeViewState((e) => {
      if (this.webViewPanel) {
        this.setFocused(this.webViewPanel.active);
      }
    }, null);
  }

  protected setFocused(focusedValue: boolean): void {
    commands.executeCommand("setContext", this.focusedKey, focusedValue);
  }

  public dispose(): void {
    this.setFocused(false);

    // Clean up our resources
    if (this.webViewPanel) {
      this.webViewPanel.dispose();
      this.webViewPanel = undefined;
    }
  }

  public async initHtmlContent(): Promise<void> {
    if (this.webViewPanel === undefined) {
      return;
    }
    let indexHtml = await this.readResource(
      join(this.mediaPath, this.htmlFileName)
    );
    // Local path to main script run in the webview
    const scriptPathOnDisk = Uri.file(join(this.mediaPath, sep));
    const scriptUri = this.webViewPanel.webview.asWebviewUri(scriptPathOnDisk);

    indexHtml = indexHtml.replace(
      /<link href="/g,
      `<link href="${scriptUri.toString()}`
    );
    indexHtml = indexHtml.replace(
      /<script src="/g,
      `<script src="${scriptUri.toString()}`
    );
    indexHtml = indexHtml.replace(
      /<img src="/g,
      `<img src="${scriptUri.toString()}`
    );

    this.webViewPanel.webview.html = indexHtml;
  }
}
