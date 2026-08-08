/**
 * `WorkspaceHost` over `vscode.workspace.fs`, plus root discovery (HMD-0021 §8).
 *
 * Root discovery is the host's job by design: the core has no filesystem above
 * the namespace root, and this is the only party that does.
 */

import * as vscode from "vscode";

import {
  CONFIG_NAME,
  DEFAULT_PROJECT_CONFIG,
  MARKER_DIR,
  parseConfigToml,
  type DirEntry,
  type ProjectConfig,
  type WorkspaceHost,
} from "@hyper-markdown/core";

const decoder = new TextDecoder("utf-8");

export class VsCodeHost implements WorkspaceHost {
  constructor(
    readonly root: vscode.Uri,
    /** Unsaved buffers, so the preview follows the editor rather than the disk. */
    private readonly overrides: () => ReadonlyMap<string, string>,
  ) {}

  uriFor(rel: string): vscode.Uri {
    return rel === "" ? this.root : vscode.Uri.joinPath(this.root, ...rel.split("/"));
  }

  async readFile(rel: string): Promise<string> {
    const override = this.overrides().get(rel);
    if (override !== undefined) return override;
    return decoder.decode(await vscode.workspace.fs.readFile(this.uriFor(rel)));
  }

  async listDirectory(rel: string): Promise<DirEntry[]> {
    const entries = await vscode.workspace.fs.readDirectory(this.uriFor(rel));
    return entries.map(([name, kind]) => ({
      name,
      isDirectory: kind === vscode.FileType.Directory,
    }));
  }
}

export interface DiscoveredRoot {
  root: vscode.Uri;
  config: ProjectConfig;
  /** True when the configured root was missing and the folder itself was used. */
  fellBack: boolean;
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the namespace root for a workspace folder.
 *
 * Order: the `hyperMarkdown.root` setting, then `.hmd/config.toml`'s `wiki`,
 * then `doc/wiki`. If none of those exists the folder itself is used, so that
 * opening a bare directory of cards works with no setup at all (VSX-061).
 */
export async function discoverRoot(folder: vscode.Uri): Promise<DiscoveredRoot> {
  let config = { ...DEFAULT_PROJECT_CONFIG };

  const configUri = vscode.Uri.joinPath(folder, MARKER_DIR, CONFIG_NAME);
  if (await exists(configUri)) {
    try {
      config = parseConfigToml(
        decoder.decode(await vscode.workspace.fs.readFile(configUri)),
        `${MARKER_DIR}/${CONFIG_NAME}`,
      );
    } catch (exc) {
      void vscode.window.showWarningMessage(
        `Hyper-Markdown: ${exc instanceof Error ? exc.message : String(exc)}`,
      );
    }
  }

  const override = vscode.workspace.getConfiguration("hyperMarkdown").get<string>("root", "");
  const wiki = override.trim() === "" ? config.wiki : override.trim();
  const candidate = wiki === "" ? folder : vscode.Uri.joinPath(folder, ...wiki.split("/"));

  if (await exists(candidate)) return { root: candidate, config, fellBack: false };
  return { root: folder, config, fellBack: true };
}
