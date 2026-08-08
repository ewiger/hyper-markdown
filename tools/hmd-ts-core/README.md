# @hyper-markdown/core

Parser, resolver, and renderer for [hyper-markdown](https://github.com/ewiger/hyper-markdown),
in TypeScript, with no Python and no editor API.

Specified by [HMD-0020](../../doc/proposals/HMD-0020/README.md). The Python
package under [`tools/hmd/`](../hmd/) is **canonical**: where the two disagree,
Python is right and this one carries the bug.

One of three tools in the [hyper-markdown monorepo](../../README.md); the format
itself is documented at [hyper-markdown.org](https://hyper-markdown.org/). Not
published to npm yet — the VS Code extension resolves it from the workspace.

## Use

```ts
import { MemoryHost, Renderer, Workspace, check } from "@hyper-markdown/core";

const workspace = await Workspace.load(
  MemoryHost.from({
    "shared/tokens.hmd": "# Tokens\n\n## Rotation\n\nEvery 90 days.\n",
    "specs/login.hmd": "# Login\n\nsee [[tokens#Rotation]]\n\n![[tokens]]\n",
  }),
);

check(workspace);                              // HMD001..HMD016 diagnostics
new Renderer(workspace).render("specs/login.hmd"); // the document IR
```

## The filesystem port

The package imports no Node builtins, so it runs in a browser, in a web
extension, and in an in-memory test without a temporary directory. Everything
reaches the world through one interface:

```ts
interface WorkspaceHost {
  readFile(rel: string): Promise<string>;
  listDirectory(rel: string): Promise<DirEntry[]>;
}
```

`MemoryHost` ships for tests. The VS Code extension supplies one over
`vscode.workspace.fs`; a Node host is three lines.

## The IR

Ordinary GFM is an opaque HTML island; every hyper-markdown construct survives
as a typed node. That split is the design: the consumer needs no markdown
knowledge, and no consumer can lose an embed boundary by treating it as text.

```text
Document := { irVersion, path, breadcrumb, frontmatter, headings, anchors, blocks }
Block    := HtmlBlock { key, html, span }
          | EmbedBlock { key, target, resolution, document, failure, depth, span }
```

Every block carries a `key` derived from content and sibling occurrence, not
from its line number, so a consumer can patch a live view instead of rebuilding
it. Every block-level element inside `html` carries `data-line`, which is what
makes scroll sync and click-through possible at all.

## Conformance

`npm test` runs the shared corpus at
[`examples/conformance/`](../../examples/conformance/) plus a
parity check that shells out to `hmd lint` and requires byte-identical
diagnostics on `examples/small` and `doc/wiki`. Known divergences are listed in
[`conformance-xfail.json`](conformance-xfail.json); a ledgered case that starts
passing fails the build.

Work points are tracked in [`tools/STATUS.md`](../STATUS.md), and what has
changed is in [CHANGELOG.md](CHANGELOG.md).

## Working on it

[DEVELOP.md](DEVELOP.md) is this package's guide — build, the two constraints
that are easy to break, and how the ledger is kept honest.

## License

MIT — see [LICENSE](LICENSE).
