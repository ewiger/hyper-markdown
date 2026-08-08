# 2026-08-06 — the TypeScript editor line

Real-time decisions taken while drafting
[HMD-0020](../proposals/HMD-0020/README.md) and
[HMD-0021](../proposals/HMD-0021/README.md). Recorded here because none of them
are derivable from the code or the git history.

## Numbering is split by stream

`HMD-0002`–`HMD-0019` belong to the Python and MkDocs work; editor and
JavaScript proposals start at `HMD-0020`. **Issues split the same way**: the
Python line numbers from 1, this line from 100. The two streams live on separate
branches and reserve numbers without talking to each other, and a shared counter
would collide on every merge.

## Two branches, disjoint file sets

`feat/mvp` (worktree `../hyper-markdown-feat-mvp`) owns Python, MkDocs, and
`HMD-0002`. `feat/vsc-ext` owns the TypeScript packages and `HMD-0020+`.
`feat/mvp` is the merge target; both directions get merged periodically. Work
stays in disjoint directories on purpose — `tools/hmd/` is Python's,
`tools/hmd-ts-core/`, `tools/hmd-vsc-ext/`, and `conformance/` are
TypeScript's — so the merges stay mechanical. Those were `src/`, `tests/`, and
`packages/` until the repository moved to a `tools/` layout; the disjointness is
the point, not the names. `doc/proposals/README.md` is the one file both streams append to.

## Principle P5 is retired, deliberately

The sketch's "one implementation — semantics live in Python" cannot survive the
parsers in other languages the project expects, and a Rust implementation is a
live possibility. Replaced by: Python is canonical, a language-neutral
conformance corpus at `conformance/cases/` is the contract, and an
expected-failure ledger makes divergence explicit. Slight drift is acceptable
in the short term; silent drift is not.

## The flat-markdown intermediate was rejected

Resolving and expanding in Python, emitting flat markdown, and rendering it in
JavaScript was considered and dropped. Flattening destroys the embed boundary
before the UI ever sees it, and a hyper-markdown preview whose embeds render as
anonymous prose has given up the only thing it does that a markdown previewer
cannot.

## Live-on-type is a constraint, not a feature

Type on the left, see it rendered on the right, without saving — this is the
defining interaction, and the parser and IR are designed against it rather than
merely permitting it. Consequences that would otherwise look like
over-engineering: the parser never throws on partial input, every IR block
carries a stable key so the renderer patches instead of rebuilding, and
diagnostics run on a slower clock than the preview so half-typed links do not
raise squiggles.

## LSP is deferred without a decision

Superseded on 2026-08-08 — kept because what it got wrong is instructive.

It read: not "later in the plan" — genuinely open; if the feature set ever
justifies a language server, the implementation language is its own question
(TypeScript or Rust). The single constraint kept alive for it: every core entry
point accepts document *text*, not only a path.

The language is now decided, and it is neither candidate. The server will be
Python on `pygls`, living with the canonical implementation, because a language
server is a semantics server and the semantics are already there — a third
place where resolution behaviour lives is a third thing that can disagree with
the arbiter. The extension is unaffected and still requires no Python; the
Python server exists to serve every *other* editor without a second port of the
resolver being written. See [HMD-0024](../proposals/HMD-0024/README.md).

The constraint the old note kept alive as a precaution is the part that
survived, and it is now load-bearing: an unsaved buffer is a language server's
ordinary input, so text ingestion is not a nicety. On the Python side it holds
everywhere except the workspace index, which is the one layer that reads from
disk — recorded as a limitation in
[the HMD-0024 tracker](../proposals/HMD-0024/STATUS.md#limitations).
