# HMD-0001 — Status

Progress tracking for [HMD-0001](README.md): the MVP — grammar, resolution,
`hmd lint`, embed expansion, and `hmd render`.

**This file is the only place work against this proposal is tracked.** Not the
memos under `doc/memory/`, not the cards under `doc/wiki/`, not the proposal
itself. A decision that needs discussion is named here as an open question and
argued wherever it belongs; nothing else may hold a task list. Update the row in
the same commit that changes the code.

**Snapshot** (2026-08-07) — M1–M4 done, gated by 209 tests. Everything the
proposal requires to call the MVP implemented is implemented. What remains is
not code but evidence and decision: a conformance corpus, a determinism test,
and the seven open questions that block `drafted → accepted`.

Section references are to [HMD-0001](README.md) unless marked otherwise.

## Done

### M1 — model and scanner (§1–§4)

| ID | Work point | Spec |
| --- | --- | --- |
| M1 | Parsing model, masking, grammar, heading anchors, namespace root | §1–§4 |

Gated by `tests/test_scan.py` and `tests/test_parse.py`.

### M2 — resolver (§5)

| ID | Work point | Spec |
| --- | --- | --- |
| M2 | Two-phase spine walk, root sweep, folder-note binding, both import forms | §5 |

Gated by `tests/test_resolve.py` and `tests/test_imports.py`.

### M3 — `hmd lint` (§8)

| ID | Work point | Spec |
| --- | --- | --- |
| M3 | Sixteen rules with stable IDs, JSON output, CI exit codes | §8 |

Gated by both lint commands under [Gates](#gates) exiting 0.

### M4 — expansion and secondary commands (§6–§7)

| ID | Work point | Spec |
| --- | --- | --- |
| M4.1 | `embed.py` — page, `#Section`, and `#^id` expansion | §6 |
| M4.2 | Cycle detection (HMD007) and depth limit 16 (HMD008) as one shared constant | §6 |
| M4.3 | `render/flat.py` — flat-markdown emitter | §7 |
| M4.4 | <code>hmd render PATH --to markdown&#124;html</code> | §7 |
| M4.5 | `MAX_EMBED_DEPTH` moved to `embed.py`; `lint/rules.py` imports it | §6 |
| M4.6 | Tests: section stop, block marker, cycle, 17-deep chain, rewrite-from-host | Test Plan |

Gated by `tests/test_embed.py` and `tests/test_render.py`.

M1–M3 are what this proposal requires to call the MVP done. M4 is also the
prerequisite for [HMD-0002](../HMD-0002/STATUS.md): the MkDocs plugin expands
embeds, so it could not exist before the expander did.

## TODO

### Planned work

Specified, unblocked, not started.

| ID | Work point | Spec |
| --- | --- | --- |
| T1 | Conformance corpus at `tests/corpus/<case>/` with `expected.json` | Test Plan (sketch 111) |
| T2 | Determinism test: same tree twice, and with files created in a different order, byte-identical JSON | Test Plan |
| T3 | Publish `0.1.0` to PyPI — tag `v0.1.0` on `main` once the trusted publisher and the `pypi` environment exist | — |

T1 and T2 belong together and should land together. The corpus is also the
cross-implementation contract the editor line consumes, so its shape is worth
more care than its coverage.

T3 is the only work point that cannot be finished by a commit. The packaging
side of it is done — metadata, changelog, `hmd --version`, a CI job that builds
the wheel and installs it away from `src/`, and a tag-driven release workflow —
but the upload authenticates by OIDC against a trusted publisher configured on
PyPI, and that configuration lives in a web form rather than in this repository.
Until it exists the workflow runs green and fails at the upload with a `403`.
[DEVELOP.md](../../../DEVELOP.md) carries the settings to enter.

### Broken

Known defects. A row leaves this table only when a gate would catch its return.

| ID | Defect | Where | Impact |
| --- | --- | --- | --- |
| B1 | The card describes resolution as matching a slug "by filename alone", which predates the two-phase spine walk | [`doc/wiki/hyper-markdown.hmd`](../../wiki/hyper-markdown.hmd) | The card that teaches the format teaches it wrong; §5.2 resolves nearest-first along the spine, then sweeps the root, then probes imported origins |

Recorded under Backwards Compatibility in the proposal. It is a documentation
defect, not a code one — the resolver is correct.

### Limitations

Known, accepted, not being fixed now.

| ID | Limitation | Why it stands |
| --- | --- | --- |
| L1 | `hmd render --to markdown` is one-way. Erasure drops the embed boundary and the provenance of every link | A build product, not an interchange format. The editor line rejected flat markdown as its transport for exactly this reason. `md → hmd` conversion is sketched in [`doc/wiki/md-hmd-interop.hmd`](../../wiki/md-hmd-interop.hmd) and owned by no proposal |
| L2 | Embed depth is capped at 16 (HMD008) and cycles are errors (HMD007) | A bound is required; the exact number is arbitrary and cheap to change |
| L3 | The scanner is a hand-written masker, not a CommonMark block parser | Divergence from CommonMark is possible and currently undetectable — T1 is what would expose it, and Q1 is what would act on it |
| L4 | No lint suppression. Every finding must be fixed or tolerated at the call site | Q7 — adding a suppression syntax before real usage risks designing it wrong |
| L5 | The wiki graph is closed to the namespace root; links out of it are ordinary markdown links and are not checked by `hmd lint` | Deliberate (§5). MkDocs reports them at `info`, see [HMD-0002 L5](../HMD-0002/STATUS.md#limitations) |
| L6 | Indented code blocks are not masked, so a `[[link]]` inside one is seen as a link | Forced by implementation: `admonition` and `footnotes` overload the four-space indent, and masking it dropped real links from the fixture (§1, changelog 2026-07-31) |

### Open questions and blockers

Each MUST be resolved before Status moves `drafted → accepted`; that transition
is the blocker they hold up.

| ID | Question |
| --- | --- |
| Q1 | Should the scanner move to a CommonMark block parser (`markdown-it-py`, which carries source maps) once the corpus exposes real divergences? |
| Q2 | Does `use` apply to a page's own links only, or also to links inside content it embeds? §6 expansion is textual, so today the embedded page's own toggles govern — is that the right default? |
| Q3 | Should an imported search path be probed *before* the spine rather than after? §5.2 pins "after" to buy monotonicity, but an author who imports a namespace to override local names has only the named form |
| Q4 | Should `hmd graph` record each card's resolved search path, so a consumer can see what a card reaches without replaying the algorithm? |
| Q5 | When plugins arrive, does `[discovery] autodiscovery` generalize into a `[features]` table, and does that scale past a handful of toggles? |
| Q6 | Should the root sweep be bounded by page count or depth, so a large tree cannot make an unresolvable bare link expensive to diagnose? |
| Q7 | Should the MVP ship a suppression mechanism (`<!-- hmd-disable HMD001 -->`)? |

Two further questions were closed in passing by
[HMD-0002](../HMD-0002/README.md): the MkDocs URL shape (§1) and whether
`hmd render --to markdown` round-trips (§5, answered: it does not).

Deliberately left to later proposals rather than resolved here — the config
schema and root marker, stable IDs versus redirects, named excerpts versus block
anchors, and the query grammar.

One amendment is outstanding rather than open: HMD-0002 §2 adds `nav` to the
reserved frontmatter keys, which §5.3 pins as a *closed* set of `tags`, `use`,
`import`. Tracked as [HMD-0002 Q4](../HMD-0002/STATUS.md#open-questions-and-blockers)
because that proposal is where the trade was made.

## Gates

```bash
python -m pytest                              # 209 passed (whole suite)
hmd lint doc/wiki                             # exit 0, clean
hmd lint --root examples/small                # exit 0, exactly 1 warning (HMD001)
```

The `examples/small` warning is the deliberate red link that shows what an
unwritten page looks like. A clean run there is a regression, not an improvement.

## Changelog

- 2026-08-06: tracking created; M1–M3 recorded done, M4 work points enumerated.
- 2026-08-07: M4 done — `embed.py`, `render/flat.py`, `hmd render`. Expansion
  and link rewriting share one walk, since a link inside embedded content
  resolves from its own card but is written relative to the host page.
- 2026-08-07: split out of the repo-root `STATUS.md`, which tracked both
  proposals at once. Progress is now tracked per proposal, and the to-do list is
  split into planned work, broken, limitations, and open questions.
- 2026-08-08: prepared `0.1.0` for distribution — `CHANGELOG.md`, PyPI metadata,
  `hmd --version`, a packaging job in CI, and a tag-driven release workflow. The
  version now has one home, `__init__.py`, from which `pyproject.toml` derives
  its own; the suite fails if the changelog does not mention the number. The
  upload itself is T3 and waits on configuration that is not a commit.
