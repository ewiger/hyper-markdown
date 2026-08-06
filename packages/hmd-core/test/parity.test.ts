/**
 * Conformance against the canonical implementation (HMD-0020 §10).
 *
 * This is what replaces principle P5. The Python package under
 * `src/hyper_markdown/` defines the correct answer; this suite asks it, on the
 * two trees CI already gates, and requires byte-identical diagnostics.
 *
 * If the `hmd` CLI is not available the suite skips rather than fails: a
 * contributor without a Python environment should still be able to work on the
 * TypeScript half, and CI runs both.
 */

import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { check } from "../src/lint.js";
import { Workspace } from "../src/workspace.js";
import { NodeHost } from "./nodeHost.js";

const run = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

interface PythonDiagnostic {
  rule: string;
  severity: string;
  path: string;
  line: number;
  column: number;
  message: string;
  candidates?: string[];
}

async function pythonDiagnostics(root: string): Promise<PythonDiagnostic[] | null> {
  for (const [command, args] of [
    ["uv", ["run", "hmd", "lint", "--root", root, "--format", "json"]],
    ["hmd", ["lint", "--root", root, "--format", "json"]],
  ] as const) {
    try {
      const { stdout } = await run(command, [...args], { cwd: repoRoot, maxBuffer: 1 << 24 });
      return (JSON.parse(stdout) as { diagnostics: PythonDiagnostic[] }).diagnostics;
    } catch (exc) {
      const message = exc instanceof Error ? exc.message : String(exc);
      // Exit code 1 means diagnostics were found, which is a successful run.
      if (typeof (exc as { stdout?: string }).stdout === "string") {
        const stdout = (exc as { stdout: string }).stdout;
        if (stdout.trim().startsWith("{")) {
          return (JSON.parse(stdout) as { diagnostics: PythonDiagnostic[] }).diagnostics;
        }
      }
      if (!/ENOENT/.test(message)) throw exc;
    }
  }
  return null;
}

async function typescriptDiagnostics(root: string): Promise<PythonDiagnostic[]> {
  const workspace = await Workspace.load(new NodeHost(root));
  return check(workspace).map((d) => {
    const out: PythonDiagnostic = {
      rule: d.rule,
      severity: d.severity,
      path: d.path,
      line: d.line,
      column: d.column,
      message: d.message,
    };
    if (d.candidates && d.candidates.length > 0) out.candidates = [...d.candidates];
    return out;
  });
}

describe.each([
  ["examples/small", resolve(repoRoot, "examples/small")],
  ["examples/cs-alg-sorting", resolve(repoRoot, "examples/cs-alg-sorting")],
  ["doc/wiki", resolve(repoRoot, "doc/wiki")],
])("parity on %s", (_label, root) => {
  it("produces the diagnostics the canonical implementation produces", async () => {
    const expected = await pythonDiagnostics(root);
    if (expected === null) {
      // eslint-disable-next-line no-console
      console.warn("hmd CLI unavailable — parity check skipped");
      return;
    }
    expect(await typescriptDiagnostics(root)).toEqual(expected);
  }, 60_000);
});
