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

  it("creates a second panel rather than revealing the first", () => {
    const store = fakeStore();
    const first = PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Active });
    const second = PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Active });

    expect(openPanels()).toHaveLength(2);
    expect(first).not.toBe(second);
  });
});

describe("which card a panel holds", () => {
  it("pins to the card that was active, and ignores the next editor", () => {
    const store = fakeStore();
    stub.window.activeTextEditor = editorFor("notes/alpha.hmd");

    PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Active });
    const tab = openPanels()[0]?.panel as unknown as { title: string };
    expect(tab.title).toBe("alpha");

    stub.window.activeTextEditor = editorFor("notes/beta.hmd");
    stub.window.activeEditorChanged.fire();
    expect(tab.title).toBe("alpha");
  });

  it("follows the active editor when it was opened from a non-card", () => {
    const store = fakeStore();
    stub.window.activeTextEditor = editorFor(null);

    PreviewPanel.open(store, extensionUri, { column: vscode.ViewColumn.Active });
    const tab = openPanels()[0]?.panel as unknown as { title: string };
    expect(tab.title).toBe("Hyper-Markdown Preview");

    stub.window.activeTextEditor = editorFor("notes/beta.hmd");
    stub.window.activeEditorChanged.fire();
    expect(tab.title).toBe("beta");
  });

  it("restores a pinned card after a window reload", () => {
    const store = fakeStore();
    const panel = new (vscode as unknown as {
      WebviewPanelStub: new (title: string) => unknown;
    }).WebviewPanelStub("Hyper-Markdown Preview") as vscode.WebviewPanel;

    PreviewPanel.restore(panel, store, extensionUri, {
      card: "notes/gamma.hmd",
      pinned: true,
    });

    expect(panel.title).toBe("gamma");
  });
});
