/**
 * The filesystem port (HMD-0020 §1, §6).
 *
 * The core reaches the world through this interface and nothing else, so it
 * runs unchanged over `vscode.workspace.fs`, over `node:fs`, over an in-memory
 * map in tests, and in a browser.
 */

export interface DirEntry {
  name: string;
  isDirectory: boolean;
}

export interface WorkspaceHost {
  /** Read a file, given a path relative to the namespace root. */
  readFile(rel: string): Promise<string>;
  /** List a directory, given a path relative to the namespace root ("" is the root). */
  listDirectory(rel: string): Promise<DirEntry[]>;
}

/** An in-memory host, for tests and for previewing an unsaved buffer. */
export class MemoryHost implements WorkspaceHost {
  constructor(private readonly files: Map<string, string>) {}

  static from(files: Record<string, string>): MemoryHost {
    return new MemoryHost(new Map(Object.entries(files)));
  }

  async readFile(rel: string): Promise<string> {
    const text = this.files.get(rel);
    if (text === undefined) throw new Error(`no such file: ${rel}`);
    return text;
  }

  async listDirectory(rel: string): Promise<DirEntry[]> {
    const prefix = rel === "" ? "" : `${rel}/`;
    const names = new Map<string, boolean>();
    for (const path of this.files.keys()) {
      if (!path.startsWith(prefix)) continue;
      const remainder = path.slice(prefix.length);
      if (remainder === "") continue;
      const cut = remainder.indexOf("/");
      if (cut === -1) names.set(remainder, false);
      else names.set(remainder.slice(0, cut), true);
    }
    return [...names.entries()]
      .map(([name, isDirectory]) => ({ name, isDirectory }))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }
}
