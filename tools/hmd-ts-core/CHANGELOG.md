# Changelog — `@hyper-markdown/core`

Notable changes to the TypeScript implementation, newest first. This file covers
**this package only**; the other tools in the monorepo version themselves and
keep their own changelogs, and [the repository's index](../../CHANGELOG.md)
lists them.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) with
the usual `0.x` caveat: **the format itself may change between minor versions.**

**Not published to npm yet.** `0.1.0` is the version the VS Code extension
resolves from the workspace, so everything so far is unreleased. Implementation
state is tracked per work point in
[`doc/vsc-ext/STATUS.md`](../../doc/vsc-ext/STATUS.md), against
[HMD-0020](../../doc/proposals/HMD-0020/README.md).

## [Unreleased]

### Added

- **Scanner and grammar.** Masking that preserves offsets, the `toc` slug and
  dedup algorithm, `---` frontmatter under `js-yaml`'s JSON schema, and a parser
  that never throws on partial input — a preview that renders while you type has
  no valid document to wait for.
- **The four-phase resolver** and a workspace index: explicit imports, the spine
  walk, imported search paths, then one whole-tree sweep, with folder notes
  addressable under both of their names.
- **`WorkspaceHost`, the filesystem port.** The package imports no Node
  builtins, so it runs in a browser, in a web extension, and in an in-memory
  test with no temporary directory. `MemoryHost` ships for tests.
- **Lint rules `HMD001`–`HMD016`**, sorted, emitting no rule ID the canonical
  implementation does not define.
- **The document IR, embed expansion, and a `markdown-it` renderer.** Ordinary
  GFM is an opaque HTML island; every hyper-markdown construct survives as a
  typed node, so no consumer can lose an embed boundary by treating it as text.
  Blocks are keyed by content and sibling occurrence rather than by line number,
  which is what lets a live view be patched instead of rebuilt, and every
  block-level element carries `data-line` for scroll sync and click-through.
- **A link graph** with a reverse edge map, for backlinks.
- **Callouts, math, and D2 diagrams** — `!!!` admonitions, `???`/`???+` details,
  KaTeX with arithmatex smart-dollar semantics, and diagram fences carrying a
  content-addressed cache key. `IR_VERSION` is 2.
- **The conformance corpus runner and its ledger.** `npm test` runs the shared
  corpus at [`examples/conformance/`](../../examples/conformance/) plus a parity check that shells
  out to `hmd lint` and requires byte-identical diagnostics on `examples/small`,
  `examples/cs-alg-sorting`, and `doc/wiki`. A ledgered case that starts passing
  fails the build, so the ledger cannot rot into a lie.
- **`HMD_REQUIRE_PARITY`.** The parity suite skips when no Python is present,
  which is right on a contributor's laptop and wrong anywhere the canonical
  implementation is installed on purpose. With the variable set it fails instead,
  and CI sets it.

### Known divergences

Ledgered in [`conformance-xfail.json`](conformance-xfail.json), which carries the
reason for each: `HMD017` and the publication model behind it are unported; raw
HTML is escaped rather than passed through, deliberately, because a webview
rendering workspace HTML is a script-injection surface; `~x~` subscript is
unsupported; setext headings are recognised here and not by the canonical
scanner, so their slugs are not addressable; column numbers count UTF-16 code
units here and code points in Python, which can differ by one per astral
character; and math is typeset by KaTeX rather than by the site's MathJax.

### Documentation

- This package carries its own README, changelog, and license, rather than
  borrowing the repository's.

[Unreleased]: https://github.com/ewiger/hyper-markdown/commits/main/tools/hmd-ts-core
