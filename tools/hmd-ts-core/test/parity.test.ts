/**
 * Conformance against the canonical implementation (HMD-0020 §10).
 *
 * This is what replaces principle P5. The Python package under
 * `tools/hmd/src/hypermarkdown/` defines the correct answer; this suite asks
 * it, on the three trees CI already gates, and requires byte-identical
 * diagnostics.
 *
 * If the `hmd` CLI is not available the suite skips rather than fails: a
 * contributor without a Python environment should still be able to work on the
 * TypeScript half, and CI runs both. The skip is declared through `ctx.skip()`
 * so it is reported as a skip and counted as one — a bare `return` left the
 * case reporting as a pass, which is how a check that stopped running looks
 * exactly like a check that ran. Anywhere the Python side is meant to exist,
 * set `HMD_REQUIRE_PARITY=1` and a missing CLI fails instead of skipping; CI
 * sets it, which is what stops a moved `pyproject.toml` from silently
 * retiring this suite.
 *
 * A rule named in the `rules` array of `conformance-xfail.json` is one this
 * implementation does not emit at all, so comparing it would only ever restate
 * the ledger. Those diagnostics are dropped from the canonical side before the
 * comparison; every other rule is still required to match byte for byte. The
 * drop is guarded in both directions — if this implementation starts emitting a
 * ledgered rule, the entry is stale and the suite fails rather than quietly
 * ignoring real output.
 */

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { check } from "../src/lint.js";
import { Workspace } from "../src/workspace.js";
import { NodeHost } from "./nodeHost.js";
import { packageRoot, repoRoot } from "./repoRoot.js";

const run = promisify(execFile);

const ledger = JSON.parse(
  await readFile(resolve(packageRoot, "conformance-xfail.json"), "utf8"),
) as { rules?: Array<{ id: string; reason: string }> };

const unimplementedRules = new Set((ledger.rules ?? []).map((entry) => entry.id));

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
  it("produces the diagnostics the canonical implementation produces", async (ctx) => {
    const expected = await pythonDiagnostics(root);
    if (expected === null) {
      if (process.env["HMD_REQUIRE_PARITY"]) {
        throw new Error(
          "HMD_REQUIRE_PARITY is set but neither `uv run hmd` nor `hmd` could be run from " +
            `${repoRoot}. The canonical implementation lives in tools/hmd; install it with ` +
            "`uv sync` at the repository root.",
        );
      }
      ctx.skip();
      return;
    }
    const actual = await typescriptDiagnostics(root);

    // A ledgered rule this implementation actually emits is a ledger that needs
    // deleting, and the drop below would hide it.
    const emitted = [...new Set(actual.map((d) => d.rule))].filter((rule) =>
      unimplementedRules.has(rule),
    );
    expect(
      emitted,
      `${emitted.join(", ")} is ledgered in conformance-xfail.json as unimplemented but was emitted — remove the ledger entry`,
    ).toEqual([]);

    expect(actual).toEqual(expected.filter((d) => !unimplementedRules.has(d.rule)));
  }, 60_000);
});
