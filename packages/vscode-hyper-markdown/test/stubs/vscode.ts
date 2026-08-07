/**
 * The smallest `vscode` module that lets a unit test import extension code.
 *
 * Deliberately not a mock framework: anything that needs more of the editor
 * than this belongs in the integration suite, not here.
 */

/**
 * A working emitter, not a no-op.
 *
 * The preview's tab title is driven by an event, so a stub that swallowed
 * `fire` would let the assertion pass for the wrong reason. Declared first
 * because the `window` stub constructs emitters as the module loads.
 */
export class EventEmitter<T> {
  private readonly listeners = new Set<(value: T) => void>();

  event = (listener: (value: T) => void): { dispose: () => void } => {
    this.listeners.add(listener);
    return { dispose: () => void this.listeners.delete(listener) };
  };

  fire(value: T): void {
    for (const listener of [...this.listeners]) listener(value);
  }

  dispose(): void {
    this.listeners.clear();
  }
}

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

/** Every `createWebviewPanel` call, so a test can assert where a tab landed. */
export interface CreatedPanel {
  viewType: string;
  title: string;
  showOptions: { viewColumn: number; preserveFocus?: boolean };
  panel: WebviewPanelStub;
}

export const createdPanels: CreatedPanel[] = [];

export class WebviewPanelStub {
  title: string;
  active = true;
  disposed = false;
  iconPath: unknown;
  readonly posted: unknown[] = [];

  private readonly viewStateChanged = new EventEmitter<void>();
  private readonly didDispose = new EventEmitter<void>();
  private readonly receivedMessage = new EventEmitter<unknown>();

  readonly webview = {
    html: "",
    options: {} as unknown,
    cspSource: "vscode-webview://stub",
    asWebviewUri: (uri: { toString(): string }) => uri,
    postMessage: async (message: unknown) => {
      this.posted.push(message);
      return true;
    },
    onDidReceiveMessage: this.receivedMessage.event,
  };

  constructor(title: string) {
    this.title = title;
  }

  onDidChangeViewState = this.viewStateChanged.event;
  onDidDispose = this.didDispose.event;

  /** Drive focus the way VS Code would when the user clicks another tab. */
  setActive(active: boolean): void {
    this.active = active;
    this.viewStateChanged.fire();
  }

  dispose(): void {
    this.disposed = true;
    this.didDispose.fire();
  }
}

export const window = {
  showWarningMessage: () => undefined,
  showErrorMessage: () => undefined,
  showTextDocument: async () => ({}),
  setStatusBarMessage: () => undefined,
  visibleTextEditors: [] as unknown[],
  activeTextEditor: undefined as { document: { uri: unknown } } | undefined,
  activeEditorChanged: new EventEmitter<void>(),
  visibleRangesChanged: new EventEmitter<unknown>(),
  onDidChangeActiveTextEditor: (listener: () => void) => window.activeEditorChanged.event(listener),
  onDidChangeTextEditorVisibleRanges: (listener: (event: unknown) => void) =>
    window.visibleRangesChanged.event(listener),
  createWebviewPanel: (
    viewType: string,
    title: string,
    showOptions: { viewColumn: number; preserveFocus?: boolean },
    _options?: unknown,
  ): WebviewPanelStub => {
    const panel = new WebviewPanelStub(title);
    createdPanels.push({ viewType, title, showOptions, panel });
    return panel;
  },
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
export const ViewColumn = { Active: -1, One: 1, Beside: 2 } as const;
export const TextEditorRevealType = { AtTop: 1 } as const;
export class RelativePattern {
  constructor(
    readonly base: unknown,
    readonly pattern: string,
  ) {}
}
