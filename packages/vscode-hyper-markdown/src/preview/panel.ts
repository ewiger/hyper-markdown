/**
 * The editor-column surface (HMD-0021 §3).
 *
 * Same controller, same renderer, same protocol as the sidebar view — the only
 * difference is which VS Code object hosts the HTML.
 */

import * as vscode from "vscode";

import type { Store } from "../store.js";
import { PreviewController } from "./controller.js";
import { shellFor } from "./html.js";

const VIEW_TYPE = "hyperMarkdown.previewPanel";

export class PreviewPanel implements vscode.Disposable {
  private static current: PreviewPanel | undefined;

  private readonly controller: PreviewController;

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    store: Store,
    extensionUri: vscode.Uri,
  ) {
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
    };
    panel.webview.html = shellFor(panel.webview, extensionUri);
    this.controller = new PreviewController(store, panel.webview);
    panel.onDidDispose(() => this.dispose());
  }

  static open(store: Store, extensionUri: vscode.Uri): PreviewPanel {
    if (PreviewPanel.current !== undefined) {
      PreviewPanel.current.panel.reveal(vscode.ViewColumn.Beside, true);
      return PreviewPanel.current;
    }
    const panel = vscode.window.createWebviewPanel(
      VIEW_TYPE,
      "Hyper-Markdown Preview",
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true },
    );
    PreviewPanel.current = new PreviewPanel(panel, store, extensionUri);
    return PreviewPanel.current;
  }

  togglePin(): boolean {
    return this.controller.togglePin();
  }

  dispose(): void {
    this.controller.dispose();
    if (PreviewPanel.current === this) PreviewPanel.current = undefined;
  }
}
