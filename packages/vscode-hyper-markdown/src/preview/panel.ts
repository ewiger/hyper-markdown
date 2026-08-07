/**
 * The preview surface: a tab in an editor column (HMD-0021 §3).
 *
 * There is no singleton. A column of preview tabs, each held on its own card,
 * is the point of the surface — the same way a column holds several editors.
 * What the panels share is one `PreviewController` implementation, not one
 * instance of it.
 */

import * as vscode from "vscode";

import { SUFFIX } from "@hyper-markdown/core";

import type { Store } from "../store.js";
import { PreviewController } from "./controller.js";
import { shellFor } from "./html.js";

export const VIEW_TYPE = "hyperMarkdown.previewPanel";

const UNTITLED = "Hyper-Markdown Preview";

/** State persisted by the webview and handed back on window reload. */
export interface PanelState {
  card: string | null;
  pinned: boolean;
}

export interface OpenOptions {
  /** Which column the tab lands in. */
  column: vscode.ViewColumn;
  /**
   * Card to hold, or null to follow the active editor.
   *
   * Null is resolved against the active editor at open time, so a preview
   * opened from a card is pinned to it: several *following* panels would all
   * show the same thing, which is not a column worth having.
   */
  card?: string | null;
  preserveFocus?: boolean;
}

export class PreviewPanel implements vscode.Disposable {
  private static readonly panels = new Set<PreviewPanel>();

  /** The focused preview tab, for commands that act on "this preview". */
  static active: PreviewPanel | undefined;

  private readonly controller: PreviewController;
  private readonly disposables: vscode.Disposable[] = [];

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    store: Store,
    extensionUri: vscode.Uri,
  ) {
    panel.iconPath = vscode.Uri.joinPath(extensionUri, "media", "logo.svg");
    panel.webview.html = shellFor(panel.webview, extensionUri);

    this.controller = new PreviewController(store, panel.webview);
    this.disposables.push(
      this.controller,
      this.controller.onDidChangeCard((card) => this.retitle(card)),
      panel.onDidChangeViewState(() => {
        if (panel.active) PreviewPanel.active = this;
        else if (PreviewPanel.active === this) PreviewPanel.active = undefined;
      }),
      panel.onDidDispose(() => this.dispose()),
    );

    PreviewPanel.panels.add(this);
    if (panel.active) PreviewPanel.active = this;
    this.retitle(this.controller.card);
  }

  static open(store: Store, extensionUri: vscode.Uri, options: OpenOptions): PreviewPanel {
    const panel = vscode.window.createWebviewPanel(
      VIEW_TYPE,
      UNTITLED,
      { viewColumn: options.column, preserveFocus: options.preserveFocus ?? false },
      webviewOptions(extensionUri),
    );

    const preview = new PreviewPanel(panel, store, extensionUri);
    const card = options.card === undefined ? activeCard(store) : options.card;
    if (card !== null) preview.controller.pinTo(card);
    return preview;
  }

  /** Rebuild a panel VS Code restored from a previous window (§3). */
  static restore(
    panel: vscode.WebviewPanel,
    store: Store,
    extensionUri: vscode.Uri,
    state: PanelState | null,
  ): PreviewPanel {
    panel.webview.options = webviewOptions(extensionUri);
    const preview = new PreviewPanel(panel, store, extensionUri);
    if (state !== null && state.pinned && state.card !== null) {
      preview.controller.pinTo(state.card);
    }
    return preview;
  }

  togglePin(): boolean {
    return this.controller.togglePin();
  }

  /** Tear down every live preview, for the extension's own disposal. */
  static disposeAll(): void {
    for (const preview of [...PreviewPanel.panels]) preview.dispose();
  }

  dispose(): void {
    for (const d of this.disposables.splice(0)) d.dispose();
    PreviewPanel.panels.delete(this);
    if (PreviewPanel.active === this) PreviewPanel.active = undefined;
  }

  /**
   * Name the tab after its card.
   *
   * A column holding four previews is unreadable when all four tabs say
   * "Hyper-Markdown Preview".
   */
  private retitle(card: string | null): void {
    this.panel.title = card === null ? UNTITLED : basename(card);
  }
}

function webviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
  };
}

function activeCard(store: Store): string | null {
  const editor = vscode.window.activeTextEditor;
  return editor === undefined ? null : store.relFor(editor.document.uri);
}

function basename(rel: string): string {
  const name = rel.slice(rel.lastIndexOf("/") + 1);
  return name.endsWith(SUFFIX) ? name.slice(0, -SUFFIX.length) : name;
}
