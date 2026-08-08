# Proposals

This is the index for numbered technical specifications and substantial
decisions. Proposals work like lightweight ADRs or RFCs.

Reserve a number in this index before creating its folder. Use a stable ID such
as `HMD-0001`, with the proposal itself at `HMD-0001/README.md`.

`HMD-0002` through `HMD-0019` are reserved for the Python and MkDocs line of
work. Editor and JavaScript proposals start at `HMD-0020`, so the two streams
can reserve numbers without coordinating. When the Python line exhausts `0019`
it continues at **`HMD-0100`**, leaving `0020`–`0099` to the editor line.

| ID | Status | Title | Progress |
| --- | --- | --- | --- |
| [HMD-0001](HMD-0001/README.md) | drafted | MVP — grammar, resolver, and `hmd lint` | [STATUS](HMD-0001/STATUS.md) |
| [HMD-0002](HMD-0002/README.md) | drafted | MkDocs book-mode rendering | [STATUS](HMD-0002/STATUS.md) |
| [HMD-0003](HMD-0003/README.md) | drafted | HQL — the Hyper Query Language (stub, no syntax) | [STATUS](HMD-0003/STATUS.md) |
| [HMD-0004](HMD-0004/README.md) | drafted | The hyper web — namespaces beyond one tree (stub, no mechanism) | [STATUS](HMD-0004/STATUS.md) |
| [HMD-0020](HMD-0020/README.md) | drafted | `@hyper-markdown/core` — the TypeScript document model | [STATUS](../../packages/STATUS.md) |
| [HMD-0021](HMD-0021/README.md) | drafted | The VS Code extension — the hyper-markdown preview surface | [STATUS](../../packages/STATUS.md) |
| [HMD-0022](HMD-0022/README.md) | drafted | Diagrams as committed artifacts | [STATUS](../../packages/STATUS.md) |
| HMD-0023 | reserved | Searching the wiki from the preview | — |

## Progress is tracked per proposal

Each proposal carries a sibling `STATUS.md` — what is done, what is broken, what
is a known limitation, and what is an open question or blocker. Those files are
the **only** place work is tracked; there is no repository-wide task list and no
board. A task that belongs to no proposal has nowhere to live, which usually
means it is a decision nobody has taken yet, and belongs under a tracker's open
questions.

The `README.md` / `STATUS.md` split is decision versus state: the record changes
when the design changes, the tracker changes with the commits. See
[`doc/wiki/tracking.hmd`](../wiki/tracking.hmd) for the convention in full.

The editor line varies this in one way: `HMD-0020`+ share a single
[`packages/STATUS.md`](../../packages/STATUS.md) rather than one tracker each,
because the milestones interleave across the two packages, and it keeps a board
in [`doc/issues/`](../issues/) for defects found against a running extension.
