/**
 * The webview shell and its content security policy (HMD-0021 §11).
 *
 * `default-src 'none'` with no `connect-src` means the preview cannot reach the
 * network at all. Everything it renders is already in the message it was sent.
 */

import * as vscode from "vscode";

export function makeNonce(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface ShellOptions {
  scriptUri: string;
  styleUri: string;
  /** KaTeX's stylesheet, copied into `media/katex/` at build time. */
  katexUri: string;
  cspSource: string;
  nonce: string;
}

/**
 * Build the shell.
 *
 * A pure function of its inputs, so the policy and the nonce can be asserted in
 * a unit test without a running editor — which is the only way a CSP regression
 * gets caught before a user meets it.
 */
export function buildShell(options: ShellOptions): string {
  const csp = [
    "default-src 'none'",
    `img-src ${options.cspSource} data:`,
    `font-src ${options.cspSource}`,
    `style-src ${options.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${options.nonce}'`,
  ].join("; ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="${options.katexUri}" rel="stylesheet">
<link href="${options.styleUri}" rel="stylesheet">
<title>Hyper-Markdown</title>
</head>
<body>
<header class="hmd-chrome">
  <nav class="hmd-tabs" role="tablist">
    <button class="hmd-tab is-active" role="tab" data-mode="rendered" aria-selected="true">Rendered</button>
    <button class="hmd-tab" role="tab" data-mode="backlinks" aria-selected="false">Backlinks</button>
  </nav>
  <div class="hmd-breadcrumb" id="hmd-breadcrumb"></div>
</header>
<main id="hmd-content" class="hmd-content" tabindex="-1"></main>
<div id="hmd-status" class="hmd-status" hidden></div>
<script nonce="${options.nonce}" src="${options.scriptUri}"></script>
</body>
</html>`;
}

/** The shell for a live webview, wired to its own resource roots. */
export function shellFor(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  return buildShell({
    scriptUri: webview
      .asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "webview.js"))
      .toString(),
    styleUri: webview
      .asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "webview.css"))
      .toString(),
    katexUri: webview
      .asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "katex", "katex.min.css"))
      .toString(),
    cspSource: webview.cspSource,
    nonce: makeNonce(),
  });
}
