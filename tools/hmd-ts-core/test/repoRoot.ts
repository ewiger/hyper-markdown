/**
 * Where the repository root is, found rather than counted.
 *
 * Both suites that need it — the conformance runner and the parity check —
 * read fixtures that live above this package: `examples/conformance/cases/`
 * and the runnable trees beside it. The previous spelling was
 * `resolve(here, "../../..")`, which is correct only for one nesting depth
 * and, when that depth changes, resolves to some other real directory and
 * reports "no cases found" or an empty tree instead of erroring. That is the
 * failure mode a move must not have, so the root is located by the markers the
 * callers actually depend on, and a checkout that does not have them raises
 * here with the search printed.
 */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MARKERS = ["examples/conformance/cases", "examples/small"];

function findRepoRoot(start: string): string {
  const searched: string[] = [];
  let dir = start;
  for (;;) {
    searched.push(dir);
    if (MARKERS.every((marker) => existsSync(resolve(dir, marker)))) return dir;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        `repository root not found: no ancestor of ${start} holds all of ` +
          `${MARKERS.join(", ")}. Searched:\n  ${searched.join("\n  ")}`,
      );
    }
    dir = parent;
  }
}

export const repoRoot = findRepoRoot(dirname(fileURLToPath(import.meta.url)));

/** This package's own directory, wherever it has been moved to. */
export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
