/**
 * The smallest `vscode` module that lets a unit test import extension code.
 *
 * Deliberately not a mock framework: anything that needs more of the editor
 * than this belongs in the integration suite, not here.
 */

export class Position {
  constructor(
    readonly line: number,
    readonly character: number,
  ) {}
}

export class Range {
  constructor(
    readonly startLine: number,
    readonly startCharacter: number,
    readonly endLine: number,
    readonly endCharacter: number,
  ) {}
}

export class Diagnostic {
  code: string | undefined;
  source: string | undefined;
  constructor(
    readonly range: Range,
    readonly message: string,
    readonly severity: number,
  ) {}
}

export const DiagnosticSeverity = { Error: 0, Warning: 1 } as const;

export class WorkspaceEdit {
  readonly operations: unknown[] = [];
  createFile(...args: unknown[]): void {
    this.operations.push(["createFile", ...args]);
  }
  insert(...args: unknown[]): void {
    this.operations.push(["insert", ...args]);
  }
}

export const Uri = {
  joinPath: (base: { path: string }, ...parts: string[]) => ({
    path: [base.path, ...parts].join("/"),
    toString: () => [base.path, ...parts].join("/"),
  }),
};

export const workspace = {
  isTrusted: true,
  getConfiguration: () => ({ get: <T>(_key: string, fallback: T): T => fallback }),
  textDocuments: [] as unknown[],
  applyEdit: async () => true,
  openTextDocument: async () => ({}),
};

export const window = {
  showWarningMessage: () => undefined,
  showErrorMessage: () => undefined,
  showTextDocument: async () => ({}),
  visibleTextEditors: [] as unknown[],
};

export const languages = {
  createDiagnosticCollection: () => ({
    set: () => undefined,
    clear: () => undefined,
    dispose: () => undefined,
  }),
};

export const commands = { executeCommand: async () => undefined };
export const FileType = { File: 1, Directory: 2 } as const;
export const ViewColumn = { One: 1, Beside: 2 } as const;
export const TextEditorRevealType = { AtTop: 1 } as const;
export class EventEmitter<T> {
  event = (_listener: (value: T) => void) => ({ dispose: () => undefined });
  fire(_value: T): void {}
  dispose(): void {}
}
export class RelativePattern {
  constructor(
    readonly base: unknown,
    readonly pattern: string,
  ) {}
}
