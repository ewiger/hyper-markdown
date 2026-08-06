/**
 * Activation, commands, and disposables (HMD-0021 §1).
 *
 * Activation is `onLanguage:hmd`. A knowledge-base extension that costs startup
 * time in every window will be uninstalled by people who have one `.hmd` file.
 */

import * as vscode from "vscode";

import { createCard } from "./commands/createCard.js";
import { DiagnosticPublisher } from "./diagnostics.js";
import { PreviewPanel } from "./preview/panel.js";
import { PreviewViewProvider, VIEW_ID } from "./preview/view.js";
import { Store } from "./store.js";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const store = new Store();
  context.subscriptions.push(store);

  const provider = new PreviewViewProvider(store, context.extensionUri);
  context.subscriptions.push(
    provider,
    vscode.window.registerWebviewViewProvider(VIEW_ID, provider, {
      webviewOptions: { retainContextWhenHidden: false },
    }),
  );

  const diagnostics = new DiagnosticPublisher(store);
  context.subscriptions.push(diagnostics);

  context.subscriptions.push(
    vscode.commands.registerCommand("hyperMarkdown.openPreview", async () => {
      await provider.reveal();
    }),
    vscode.commands.registerCommand("hyperMarkdown.openPreviewToSide", () => {
      PreviewPanel.open(store, context.extensionUri);
    }),
    vscode.commands.registerCommand("hyperMarkdown.togglePin", () => {
      const pinned = provider.togglePin();
      if (pinned !== null) {
        void vscode.window.setStatusBarMessage(
          pinned ? "Hyper-Markdown: preview pinned" : "Hyper-Markdown: preview following",
          2000,
        );
      }
    }),
    vscode.commands.registerCommand("hyperMarkdown.refreshIndex", async () => {
      await store.rebuild();
      diagnostics.refresh();
    }),
    vscode.commands.registerCommand("hyperMarkdown.createCardFromLink", async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor === undefined) return;
      const target = await vscode.window.showInputBox({
        prompt: "Card to create, as it would be written in a [[wikilink]]",
      });
      if (target === undefined || target.trim() === "") return;
      await createCard(store, store.relFor(editor.document.uri), target.trim());
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("hyperMarkdown.root")) void store.rebuild();
      else if (event.affectsConfiguration("hyperMarkdown")) diagnostics.refresh();
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => void store.rebuild()),
  );

  try {
    await store.initialize();
  } catch (exc) {
    void vscode.window.showErrorMessage(
      `Hyper-Markdown could not index this workspace: ${
        exc instanceof Error ? exc.message : String(exc)
      }`,
    );
  }
}

export function deactivate(): void {
  // Everything is registered on context.subscriptions.
}
