# STATUS

The single index of where the implementation stands against
[HMD-0001](doc/proposals/HMD-0001/README.md). One row per work point; update the
row in the same commit that changes the code.

**Legend** — `done` shipped and gated by a test · `wip` in progress ·
`ready` specified, unblocked, not started · `blocked` waiting on a decision ·
`unspec` no normative text exists yet.

**Snapshot** (2026-08-06): M1–M3 done. MVP acceptance met. M4 → M5 is the next
block, now specified by [HMD-0002](doc/proposals/HMD-0002/README.md) (drafted).

---

## Milestones

| # | Milestone | State | Gate |
| --- | --- | --- | --- |
| M1 | Model and scanner | **done** | `tests/test_scan.py`, `tests/test_parse.py` |
| M2 | Resolver | **done** | `tests/test_resolve.py`, `tests/test_imports.py` |
| M3 | `hmd lint` | **done** | both lint gates below exit 0 |
| M4 | Expansion and secondary commands | **ready** | `hmd render` round-trips the fixture |
| M5 | MkDocs plugin | **ready** | `mkdocs build --strict` green |

M1–M3 are what HMD-0001 requires to call the MVP done. M4 and M5 are the next
big step; both are specified by
[HMD-0002](doc/proposals/HMD-0002/README.md).

## Work points

### M4 — expansion and secondary commands

Prerequisite for M5: the MkDocs extension expands embeds, so it cannot exist
before the expander does.

| ID | Work point | Spec | State |
| --- | --- | --- | --- |
| M4.1 | `embed.py` — page, `#Section`, and `#^id` expansion | §6 | ready |
| M4.2 | Cycle detection (HMD007) and depth limit 16 (HMD008) as one shared constant | §6 | ready |
| M4.3 | `render/flat.py` — flat-markdown emitter | §7 | ready |
| M4.4 | `hmd render PATH --to markdown\|html` | §7 | ready |
| M4.5 | HMD007 / HMD008 wired into `lint/rules.py` — currently unreachable, no expander exists | §8 | ready |
| M4.6 | Corpus cases for expansion: section stop, 2-page cycle, 17-deep chain | Test Plan | ready |

### M5 — MkDocs

Spec references are to [HMD-0002](doc/proposals/HMD-0002/README.md).

| ID | Work point | Spec | State |
| --- | --- | --- | --- |
| M5.1 | `urls.py` — `a/b.hmd` → `a/b/`, folder notes collapse, relative rewrites | §1 | ready |
| M5.2 | Nav derivation, default order, the `nav` frontmatter key (HMD013 on malformed) | §2 | ready |
| M5.3 | `mkdocs_plugin.py` — `on_files` registration of `.hmd` | §5 | blocked on M5.1 |
| M5.4 | `render/markdown_ext.py` — rewrite resolved links; expansion at `on_page_markdown` | §3 | blocked on M4.1, M5.1 |
| M5.5 | Red links render as `<a class="hmd-redlink">`, build stays green | §4 | blocked on M5.4 |
| M5.6 | Plain `.md` files build as ordinary pages, unlinkable | §4 | ready |
| M5.7 | Expansion-introduced slug collisions dedupe via `toc` and report HMD011 | §3 | blocked on M4.1 |
| M5.8 | `on_serve` watcher so `mkdocs serve` livereloads on `.hmd` edits | §5 | ready |
| M5.9 | `mkdocs.yml` at the repo root, extension list of HMD-0001 §9 enabled | §5 | blocked on M5.1 |
| M5.10 | `[project.entry-points."mkdocs.plugins"]` in `pyproject.toml` — **missing today** | Reference Impl. | ready |
| M5.11 | `use_directory_urls: false` fails the build with a usage error | §1 | blocked on M5.3 |
| M5.12 | Integration test: build succeeds, `.hmd` pages present in output, red links carry the class | Test Plan | blocked on M5.3 |

### Cross-cutting

| ID | Work point | Spec | State |
| --- | --- | --- | --- |
| X.1 | Conformance corpus at `tests/corpus/<case>/` with `expected.json` | Test Plan (sketch 111) | **not started** |
| X.2 | Determinism test: same tree twice, and with files created in a different order, byte-identical JSON | Test Plan | **not started** |
| X.3 | `doc/wiki/hyper-markdown.hmd` still describes resolution as "by filename alone" — predates the spine walk | Backwards Compat. | ready |
| X.4 | `mkdocs build --strict` added to `.github/workflows/ci.yml` | Deployment | blocked on M5 |
| X.5 | Move HMD-0001 from `drafted` to `accepted` — requires its nine Open Questions resolved | Open Questions | blocked |
| X.6 | `doc/memory/` does not exist, though `CLAUDE.md` instructs every agent invocation to read it | CLAUDE.md | ready |

## Decisions

Five decisions blocked M5. [HMD-0002](doc/proposals/HMD-0002/README.md) answers
all five, and closes HMD-0001 open questions 8 and 9 in passing:

| Decision | Answer | Where |
| --- | --- | --- |
| URL shape | `a/b.hmd` → `a/b/index.html`, `use_directory_urls` required | §1 |
| Nav order | derived; `nav: <int>` frontmatter key overrides | §2 |
| Where embeds expand | `on_page_markdown`, before Python-Markdown | §3 |
| `.md` files in the tree | build normally, unlinkable | §4 |
| `hmd render --to markdown` | one-way build product, no round-trip | §5 |

Three open questions remain in HMD-0002 and must close before it moves to
`accepted`; none of them block starting M4.

## Gates

```bash
python -m pytest                              # 141 passed
hmd lint doc/wiki                             # exit 0, clean
hmd lint --root examples/small                # exit 0, exactly 1 warning (HMD001)
mkdocs build --strict                         # M5 — not yet runnable
```

## Related indexes

- [doc/proposals/README.md](doc/proposals/README.md) — proposal numbers and status
- [doc/issues/kanban.yaml](doc/issues/kanban.yaml) — issue cards; currently empty.
  This file is the milestone tracker; the kanban stays the place for granular,
  short-lived cards.

## Changelog

- 2026-08-06: created; M1–M3 recorded done, M4/M5 work points enumerated,
  five decisions blocking M5 pulled out.
- 2026-08-06: HMD-0002 drafted; all five decisions answered, M5 moves from
  `blocked` to `ready`.
