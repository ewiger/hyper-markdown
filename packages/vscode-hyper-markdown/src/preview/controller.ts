/**
 * One preview tab's behaviour (HMD-0021 §3, §5.1, §6).
 *
 * Several of these are alive at once — one per preview tab — so a controller
 * owns only what is per-preview: which card it holds, whether it is pinned,
 * and its scroll bookkeeping. Anything shared, including the index and the
 * unsaved-buffer overrides, belongs to the `Store`.
 */

import * as vscode from "vscode";

import { IR_VERSION, SUFFIX } from "@hyper-markdown/core";

import { createCard } from "../commands/createCard.js";
import {
  isSafeRelativePath,
  parseWebviewMessage,
  type HostMessage,
  type PreviewMode,
  type PreviewSettings,
} from "../protocol.js";
import { REPARSE_DEBOUNCE_MS, debounce, type Store } from "../store.js";

/** How long to ignore the other side's scroll after applying one (§6). */
export const ECHO_LOCKOUT_MS = 250;
/** Throttle on preview -> editor scroll notifications (§6). */
export const SCROLL_THROTTLE_MS = 50;

export class PreviewController implements vscode.Disposable {
  private mode: PreviewMode = "rendered";
  private pinned = false;
  private current: string | null = null;
  private lastAppliedScroll = 0;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly refresh = debounce(REPARSE_DEBOUNCE_MS, () => this.send());
  private readonly cardChanged = new vscode.EventEmitter<string | null>();

  /** Fires when this preview moves to a different card. */
  readonly onDidChangeCard = this.cardChanged.event;

  constructor(
    private readonly store: Store,
    private readonly webview: vscode.Webview,
  ) {
    this.disposables.push(
      webview.onDidReceiveMessage((raw: unknown) => this.receive(raw)),
      store.onDidChange((rel) => {
        if (rel === null || rel === this.current) this.refresh();
      }),
      vscode.window.onDidChangeActiveTextEditor(() => this.follow()),
      vscode.window.onDidChangeTextEditorVisibleRanges((event) => this.onEditorScroll(event)),
    );
    this.follow();
  }

  dispose(): void {
    this.refresh.cancel();
    for (const d of this.disposables) d.dispose();
    this.cardChanged.dispose();
  }

  get card(): string | null {
    return this.current;
  }

  togglePin(): boolean {
    this.pinned = !this.pinned;
    this.send();
    return this.pinned;
  }

  /**
   * Hold this preview on one card for good.
   *
   * `show` alone would not survive the next active-editor change, and a tab
   * opened from a card is expected to keep showing that card.
   */
  pinTo(rel: string): void {
    this.pinned = true;
    this.setCard(rel);
    this.send();
  }

  setMode(mode: PreviewMode): void {
    this.mode = mode;
    this.send();
  }

  /** Point the preview at one card, regardless of the active editor. */
  show(rel: string): void {
    this.setCard(rel);
    this.send();
  }

  // -- editor -> preview -----------------------------------------------

  private follow(): void {
    if (this.pinned) return;
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined) return;
    const rel = this.store.relFor(editor.document.uri);
    if (rel === null) return;
    this.setCard(rel);
    this.send();
  }

  private setCard(rel: string | null): void {
    if (this.current === rel) return;
    this.current = rel;
    this.cardChanged.fire(rel);
  }

  private onEditorScroll(event: vscode.TextEditorVisibleRangesChangeEvent): void {
    if (!this.settings().scrollSync) return;
    if (Date.now() - this.lastAppliedScroll < ECHO_LOCKOUT_MS) return;
    const rel = this.store.relFor(event.textEditor.document.uri);
    if (rel === null || rel !== this.current) return;
    const range = event.visibleRanges[0];
    if (range === undefined) return;
    this.post({ type: "revealLine", line: range.start.line + 1 });
  }

  // -- preview -> editor -----------------------------------------------

  private receive(raw: unknown): void {
    const message = parseWebviewMessage(raw);
    if (message === null) return;

    switch (message.type) {
      case "ready":
        this.send();
        return;
      case "modeChanged":
        this.mode = message.mode;
        return;
      case "scrolled":
        this.applyScroll(message.line);
        return;
      case "openSource":
        void this.open(message.path, message.line, null);
        return;
      case "openTarget":
        void this.open(message.path, null, message.fragment);
        return;
      case "createCard":
        void createCard(this.store, this.current, message.target);
        return;
      default:
        return;
    }
  }

  private applyScroll(line: number): void {
    if (!this.settings().scrollSync) return;
    const editor = vscode.window.visibleTextEditors.find(
      (e) => this.store.relFor(e.document.uri) === this.current,
    );
    if (editor === undefined) return;
    this.lastAppliedScroll = Date.now();
    const target = Math.min(Math.max(line - 1, 0), editor.document.lineCount - 1);
    editor.revealRange(
      new vscode.Range(target, 0, target, 0),
      vscode.TextEditorRevealType.AtTop,
    );
  }

  private async open(
    requested: string,
    line: number | null,
    fragment: string | null,
  ): Promise<void> {
    // An empty path means "the card being previewed", which is what a
    // click-to-reveal on ordinary rendered content asks for (VSX-021).
    const path = requested === "" ? this.current : requested;
    if (path === null) return;

    // The renderer only sends paths the core produced, so this can only fire on
    // a defect — which is exactly when a file-read primitive would be worth
    // having (§4).
    if (!isSafeRelativePath(path) || !path.endsWith(SUFFIX)) return;
    const uri = this.store.uriFor(path);
    if (uri === null) return;

    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document, {
      preserveFocus: false,
      viewColumn: vscode.ViewColumn.One,
    });

    const target = line ?? this.lineOfFragment(path, fragment);
    if (target !== null) {
      const at = Math.min(Math.max(target - 1, 0), document.lineCount - 1);
      editor.selection = new vscode.Selection(at, 0, at, 0);
      editor.revealRange(new vscode.Range(at, 0, at, 0), vscode.TextEditorRevealType.AtTop);
    }
  }

  private lineOfFragment(path: string, fragment: string | null): number | null {
    if (fragment === null) return null;
    const ir = this.store.render(path);
    if (ir === null) return null;
    const heading = ir.headings.find((h) => h.slug === fragment || h.text === fragment);
    return heading?.line ?? null;
  }

  // -- delivery --------------------------------------------------------

  private settings(): PreviewSettings {
    const config = vscode.workspace.getConfiguration("hyperMarkdown");
    return {
      scrollSync: config.get<boolean>("preview.scrollSync", true),
      embeds: config.get<"expanded" | "collapsed">("preview.embeds", "expanded"),
    };
  }

  /**
   * Send the current card.
   *
   * A failed render leaves the previous one on screen: stale content with a
   * warning is strictly better than a blank panel, because the author can still
   * read what they wrote (§5.1).
   */
  private send(): void {
    if (!this.store.ready) return;
    if (this.current === null) {
      this.post({ type: "error", message: "Open a .hmd card to preview it." });
      return;
    }

    if (this.mode === "backlinks") {
      this.post({
        type: "backlinks",
        irVersion: IR_VERSION,
        items: this.store.backlinksFor(this.current),
      });
      return;
    }

    let document;
    try {
      document = this.store.render(this.current);
    } catch (exc) {
      this.post({
        type: "error",
        message: `Render failed: ${exc instanceof Error ? exc.message : String(exc)}`,
      });
      return;
    }

    if (document === null) {
      this.post({ type: "error", message: `${this.current} is not in the index.` });
      return;
    }

    const mode = this.mode;
    const settings = this.settings();
    const pinned = this.pinned;
    const card = this.current;

    // Reading diagram artifacts is the one asynchronous step; the guard below
    // drops the result if the preview moved on while it was in flight.
    void this.store.attachDiagrams(document).then((withDiagrams) => {
      if (this.current !== card) return;
      this.post({
        type: "render",
        irVersion: IR_VERSION,
        document: withDiagrams,
        mode,
        settings,
        pinned,
      });
    });
  }

  private post(message: HostMessage): void {
    void this.webview.postMessage(message);
  }
}

export { SCROLL_THROTTLE_MS as PREVIEW_SCROLL_THROTTLE_MS };
