# Developing `@hypermarkdown/core`

The TypeScript implementation of the format: scanner, parser, resolver, IR,
expansion, renderer, and graph. This file is the loop for *this* package.
[The repository's `DEVELOP.md`](../../DEVELOP.md) covers what is shared, and
[`tools/hmd/DEVELOP.md`](../hmd/DEVELOP.md) is the canonical implementation's.

This package is **not** extension code. It is the second implementation the
conformance corpus arbitrates against, and its only consumer today happens to be
the VS Code extension. Where it and the Python implementation disagree about a
case the corpus covers, Python is right and this one carries the bug.

## Prerequisites

Node 20 or later. Python is needed only for the parity check, which asks the
canonical implementation what the right answer is:

```bash
npm install            # from the repository root — both TypeScript tools
uv sync --locked       # only for parity; puts `hmd` on `uv run`'s path
```

## The loop

```bash
npm run -w @hypermarkdown/core build      # tsc -> dist/
npm run -w @hypermarkdown/core typecheck  # no emit
npm run -w @hypermarkdown/core test       # vitest: scanner, resolver, IR, corpus, parity
```

`dist/` is gitignored and is what the extension imports.

## Two constraints that are easy to break

- **No Node builtins in `src/`.** Everything reaches the world through the
  `WorkspaceHost` port — `readFile` and `listDirectory` — which is what lets the
  package run in a browser, in a web extension, and in an in-memory test with no
  temporary directory. `MemoryHost` ships for tests; the extension supplies a
  host over `vscode.workspace.fs`; a Node host is three lines. An `import "node:fs"`
  anywhere under `src/` silently ends that property, and no type error announces
  it.
- **Blocks are keyed, not numbered.** Every IR block carries a key derived from
  content and sibling occurrence rather than from its line number, and every
  block-level element inside rendered HTML carries `data-line`. The first is what
  lets a live preview be patched instead of rebuilt; the second is what makes
  scroll sync and click-through possible at all. A change that regenerates keys
  per keystroke will pass the tests and make the preview jump.

The parser must also never throw on partial input. Half-typed syntax is the
normal state of a document being written, not an error case.

## Conformance is the point

```bash
npm run -w @hypermarkdown/core test              # includes corpus and parity
HMD_REQUIRE_PARITY=1 npm run -w @hypermarkdown/core test
```

- **`test/corpus.test.ts`** runs every case in
  [`examples/conformance/cases/`](../../examples/conformance/). Each
  `expected.json` was generated
  from `hmd lint` and `hmd graph` and is never written by hand.
- **`test/parity.test.ts`** shells out to `hmd lint --format json` and requires
  byte-identical diagnostics on `examples/small`, `examples/cs-alg-sorting`, and
  `doc/wiki`.
- **`conformance-xfail.json`** is the ledger of known divergences, one reason per
  entry, split into `cases`, `rules`, and `rendering`. A ledgered case that
  **starts passing**, or a ledgered rule this implementation actually emits,
  fails the build — an expected failure that starts succeeding and is not removed
  is how a ledger rots into a lie.
- **`HMD_REQUIRE_PARITY`** turns the "no Python here, skip" branch into a
  failure. That branch is right on a contributor's laptop and wrong anywhere the
  canonical implementation is installed on purpose; CI sets the variable, because
  a job that installs Python in order to ask the arbiter should not be able to
  pass by quietly not asking.

Adding a divergence is legitimate; adding one without a ledger entry is not.
Write the reason and the spec section, and say whether it is `deliberate` — that
field is the difference between a decision and a bug someone has to rediscover.

`test/repoRoot.ts` finds the repository by searching upward for the fixtures the
callers need, and throws with the search printed if it cannot. It replaced a fixed
`../../..`, which resolved somewhere wrong rather than erroring when the nesting
depth changed.

## Before you open a pull request

```bash
npm run typecheck && npm run build      # both TypeScript tools
HMD_REQUIRE_PARITY=1 npm test           # both suites, parity required
```

Run the canonical implementation's gates too if you touched anything the corpus
covers — the contract has two sides, and only one of them is enforced from here.

## The files this package owns

[`README.md`](README.md), [`CHANGELOG.md`](CHANGELOG.md), and
[`LICENSE`](LICENSE) are this package's own, and `package.json` lists all three in
`files` so they travel in a publish. None of them is a symlink. Work points are
tracked in [`doc/vsc-ext/STATUS.md`](../../doc/vsc-ext/STATUS.md), against
[HMD-0020](../../doc/proposals/HMD-0020/README.md).

Not published to npm yet: the extension resolves the package from the workspace,
so a version bump here is a bump the extension picks up on its next build.
