/**
 * The editor-column surface (HMD-0021 §3, issue 0103).
 *
 * These are the three properties that make a column of previews work, and all
 * three were wrong before: the tab lands in the column that asked for it, more
 * than one may exist, and one opened from a card keeps showing that card.
 */

import { beforeEach, describe, expect, it } from "vitest";

import * as vscode from "vscode";

import { PreviewPanel } from "../src/preview/panel.js";
import type { Store } from "../src/store.js";

const stub = vscode as unknown as {
  createdPanels: { showOptions: { viewColumn: number }; panel: { dispose(): void } }[];
  window: {
    activeTextEditor: { document: { uri: unknown } } | undefined;
    activeEditorChanged: { fire(value: void): void };
  };
  ViewColumn: { Active: number; Beside: number };
};

const extensionUri = { path: "/ext", toString: () => "/ext" } as unknown as vscode.Uri;

/**
 * A store that knows paths and nothing else.
 *
 * `ready` is false, so the controller stops before rendering — every property
 * under test is about which card a preview holds, not what it draws.
 */
function fakeStore(): Store {
  return {
    ready: false,
    onDidChange: () => ({ dispose: () => undefined }),
    relFor: (uri: unknown) => (uri as { rel: string | null }).rel,
  } as unknown as Store;
}

function editorFor(rel: string | null): { document: { uri: unknown } } {
  return { document: { uri: { rel } } };
}

function openPanels(): { showOptions: { viewColumn: number }; panel: { dispose(): void } }[] {
  return stub.createdPanels;
}

beforeEach(() => {
  for (const created of stub.createdPanels.splice(0)) created.panel.dispose();
  stub.window.activeTextEditor = undefined;
});

describe("opening a preview", () => {
  it("lands in the column that asked for it, not beside it", () => {
    const store = fakeStore();
    PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Active });

    expect(openPanels()).toHaveLength(1);
    expect(openPanels()[0]?.showOptions.viewColumn).toBe(stub.ViewColumn.Active);
  });

  it("still offers the side-by-side column for the palette command", () => {
    const store = fakeStore();
    PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Beside });

    expect(openPanels()[0]?.showOptions.viewColumn).toBe(stub.ViewColumn.Beside);
  });

  it("reveals the unpinned preview already in that column", () => {
    const store = fakeStore();
    const first = PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Active });
    const second = PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Active });

    // Two unpinned previews in one column both show the active card, so the
    // second is only a way to lose track of the first.
    expect(second).toBe(first);
    expect(openPanels()).toHaveLength(1);
    expect(openPanels()[0]?.panel).toHaveProperty("revealed", 1);
  });

  it("creates a second panel once the first is pinned", () => {
    const store = fakeStore();
    stub.window.activeTextEditor = editorFor("notes/alpha.hmd");
    const first = PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Active });
    first.togglePin();

    const second = PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Active });

    expect(second).not.toBe(first);
    expect(openPanels()).toHaveLength(2);
  });

  it("does not reuse a preview living in a different column", () => {
    const store = fakeStore();
    PreviewPanel.open(store, extensionUri, { column: 1 as vscode.ViewColumn });
    PreviewPanel.open(store, extensionUri, { column: 2 as vscode.ViewColumn });

    expect(openPanels()).toHaveLength(2);
  });
});

describe("which card a panel holds", () => {
  it("follows the active editor even when opened over a card", () => {
    const store = fakeStore();
    stub.window.activeTextEditor = editorFor("notes/alpha.hmd");

    PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Active });
    const tab = openPanels()[0]?.panel as unknown as { title: string };
    expect(tab.title).toBe("alpha");

    // Pinning on open froze the preview for the life of the tab (issue 0105).
    stub.window.activeTextEditor = editorFor("notes/beta.hmd");
    stub.window.activeEditorChanged.fire();
    expect(tab.title).toBe("beta");
  });

  it("stops following once pinned, and resumes when unpinned", () => {
    const store = fakeStore();
    stub.window.activeTextEditor = editorFor("notes/alpha.hmd");

    const preview = PreviewPanel.open(store, extensionUri, {
      column: vscode.ViewColumn.Active,
    });
    const tab = openPanels()[0]?.panel as unknown as { title: string };

    expect(preview.togglePin()).toBe(true);
    stub.window.activeTextEditor = editorFor("notes/beta.hmd");
    stub.window.activeEditorChanged.fire();
    expect(tab.title).toBe("alpha");

    expect(preview.togglePin()).toBe(false);
    stub.window.activeEditorChanged.fire();
    expect(tab.title).toBe("beta");
  });

  it("follows the active editor when it was opened from a non-card", () => {
    const store = fakeStore();
    stub.window.activeTextEditor = editorFor(null);

    PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Active });
    const tab = openPanels()[0]?.panel as unknown as { title: string };
    expect(tab.title).toBe("HyperMarkDown Preview");

    stub.window.activeTextEditor = editorFor("notes/beta.hmd");
    stub.window.activeEditorChanged.fire();
    expect(tab.title).toBe("beta");
  });

  it("comes back on its card after a reload, and still following", () => {
    const store = fakeStore();
    const panel = new (vscode as unknown as {
      WebviewPanelStub: new (title: string) => unknown;
    }).WebviewPanelStub("HyperMarkDown Preview") as vscode.WebviewPanel;

    PreviewPanel.restore(panel, store, extensionUri, { card: "notes/gamma.hmd" });
    expect(panel.title).toBe("gamma");

    // Restoring a persisted `pinned` resurrected the frozen preview from
    // storage an older build had written (issue 0105).
    stub.window.activeTextEditor = editorFor("notes/beta.hmd");
    stub.window.activeEditorChanged.fire();
    expect(panel.title).toBe("beta");
  });
});
