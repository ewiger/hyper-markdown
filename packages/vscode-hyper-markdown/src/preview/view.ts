/**
 * The sidebar surface (HMD-0021 §3).
 *
 * `retainContextWhenHidden` is deliberately off: state is rehydrated from a
 * `render` message instead, because retaining context costs memory in every
 * window for the whole session.
 */

import * as vscode from "vscode";

import type { PreviewMode } from "../protocol.js";
import type { Store } from "../store.js";
import { PreviewController } from "./controller.js";
import { shellFor } from "./html.js";

export const VIEW_ID = "hyperMarkdown.preview";

export class PreviewViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private controller: PreviewController | null = null;
  private view: vscode.WebviewView | null = null;

  constructor(
    private readonly store: Store,
    private readonly extensionUri: vscode.Uri,
  ) {}

  dispose(): void {
    this.controller?.dispose();
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
    };
    view.webview.html = shellFor(view.webview, this.extensionUri);

    this.controller?.dispose();
    this.controller = new PreviewController(this.store, view.webview);
    view.onDidDispose(() => {
      this.controller?.dispose();
      this.controller = null;
      this.view = null;
    });
  }

  async reveal(): Promise<void> {
    await vscode.commands.executeCommand(`${VIEW_ID}.focus`);
    this.view?.show?.(true);
  }

  togglePin(): boolean | null {
    return this.controller?.togglePin() ?? null;
  }

  setMode(mode: PreviewMode): void {
    this.controller?.setMode(mode);
  }
}
