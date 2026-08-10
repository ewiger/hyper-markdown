# HMD-0005 — Status

Progress tracking for [HMD-0005](README.md): the HyperMarkDown rename.

**This file is the only place work against this proposal is tracked.** Not
the memos under `doc/memory/`, not the cards under `doc/wiki/`, not the
proposal itself. A decision that needs discussion is named here as an open
question and argued wherever it belongs; nothing else may hold a task list.
Update the row in the same commit that changes the code.

**Snapshot** (2026-08-10) — the rename is complete inside the repository and
guarded against regression. `hypermarkdown` is the distribution, the import
package, the plugin key, the npm scope, the extension publisher, and the domain;
`HyperMarkDown` is the name in every human-facing string. 240 tests pass,
`mkdocs build --strict` is clean, both npm workspaces typecheck and test, and
`uv build --package hypermarkdown` produces `hypermarkdown-0.2.0` whose
compatibility alias is verified from the installed wheel.

What is left is four pieces of external configuration nobody can commit — and
one of them, the DNS record set, is why `https://hypermarkdown.org/` still fails
TLS while serving correctly over HTTP.

## Done

Nothing is implemented. The record is the only deliverable so far.

| ID | Work point | Spec |
| --- | --- | --- |
| D1 | Live state of every registry and host established by probe rather than assumption — PyPI published, npm unpublished, Open VSX namespace on the new name, Marketplace publisher on the old one, new domain serving HTTP but failing TLS, old domain answering 404 rather than redirecting | Motivation |
| D2 | Spelling fixed: `HyperMarkDown` in prose, `hypermarkdown` in identifiers | How the name is spelled |
| D3 | Out-of-scope identifiers enumerated with a reason each, so the boundary is not re-litigated per file | What deliberately keeps its current spelling |
| D4 | PyPI settled as abandon-and-republish rather than migrate, since no rename exists | The Python distribution, its module, and the project left behind |
| D5 | Entry-point alias decided as the one compatibility promise made to files this project does not own | The plugin key, and the alias that keeps existing sites building |
| D6 | Extension identity fixed at `hypermarkdown.hmd-vsc-ext`, before the first publish makes it immutable | The extension's identity on both galleries |
| D7 | DNS defect diagnosed: two `awsglobalaccelerator.com` A records on the new apex are why the certificate has not issued | The canonical host, and the state DNS has to reach |
| D8 | Extension publisher moved to `hypermarkdown` in the manifest, which is what actually selects the Open VSX namespace — `ovsx publish --packagePath` reads it from the packaged VSIX, so the workflow's URLs were never the mechanism. Every reference to the extension ID followed: both READMEs' badges and install buttons, the site's landing page, both changelogs, the workflow's two environment URLs, and the publisher pages and domain-verification target in the extension's `DEVELOP.md`. Clears B1 | The extension's identity on both galleries |
| D9 | Pending trusted publishers registered on PyPI and TestPyPI for project `hypermarkdown`, against the renamed repository. Clears B2 | The Python distribution, its module, and the project left behind |
| D10 | Python package moved to `tools/hmd/src/hypermarkdown/`. The sources import each other relatively, so nothing inside the package changed — only the twelve test modules that name it, and `tests/test_mkdocs.py`'s plugin key | The Python distribution, its module, and the project left behind |
| D11 | Distribution renamed to `hypermarkdown`: project name, version attribute, console script, `[project.urls]`, the root workspace's source and dev group, and `uv.lock` regenerated. The header comment that recorded the *opposite* decision — that the name stays — was rewritten rather than re-spelled | The Python distribution, its module, and the project left behind |
| D12 | MkDocs entry point is `hypermarkdown`, with `hyper-markdown` retained as an alias on the same class, and `mkdocs.yml` moved to the new key. Verified from an installed wheel rather than from the source tree: both keys resolve to `HyperMarkDownPlugin` | The plugin key, and the alias that keeps existing sites building |
| D13 | Both wheel smoke tests assert *both* entry-point keys, so the compatibility promise is gated rather than asserted. `--package`, the version-source path, and the PyPI environment URLs follow the new name; the trusted-publisher comment now records that a publisher follows none of the four things it pins | The plugin key, and the alias that keeps existing sites building |
| D14 | Stale filesystem paths repaired across 18 files — `src/hyper_markdown/` no longer exists, so every reference to it in the developer docs, four proposals, the conformance README, and the TypeScript ports' provenance comments was wrong rather than merely old-spelled. The `hmd` README's public API example imported a module that would now raise | Reference Implementation |
| D15 | npm scope renamed to `@hypermarkdown/core` across 40 files and the lockfile regenerated. Never published, so this had no compatibility surface at all | The TypeScript package |
| D16 | Domain and repository URLs rewritten everywhere, including the shields.io `--` escape that spells a literal hyphen and that the plain domain pattern does not match | The repository and the URLs that point at it |
| D17 | Display name is `HyperMarkDown` throughout — prose, `site_name`, `displayName`, language aliases, command categories, configuration titles, the TextMate grammar name, the diagnostic source, and the SVG `aria-label`s | How the name is spelled |
| D18 | `site_url` and `robots.txt` moved to `https://hypermarkdown.org/` together. The gate the record originally put on this — wait for TLS — was inverted by the facts: the old value names a host that now 404s outright, so moving is strictly better than waiting | The canonical host, and the state DNS has to reach |
| D19 | The wiki card is `doc/wiki/hypermarkdown.hmd`, with both inbound wikilinks updated | The wiki card that carries the project's name |
| D20 | `HyperMarkDownPlugin` tracks the prose capitalisation, resolving Q3 | What deliberately keeps its current spelling |
| D21 | `test_the_retired_name_is_gone` guards every tracked text file against both retired spellings, case-insensitively, with a twelve-file allowlist that is exactly the set where the old name is still *true*. It caught two classes of defect the same hour it was written: a `Hyper-markdown` variant the display-name pass missed, and eleven identifier positions a blanket replace had wrongly given the prose spelling — PyPI URLs, badge images, and `.hmd` link targets | Test Plan |
| D22 | `0.2.0` cut: version bumped, changelog section written with the rename as its headline, and the accumulated unreleased entries folded into it | The Python distribution, its module, and the project left behind |
| D27 | `@hypermarkdown/core` on npm — `0.1.0` hand-published as the bootstrap, `0.1.1` through `release-ts-core.yml` on the trusted publisher, tokenless and with provenance. Verified by installing from the registry: the module imports and the rendered README carries no relative links | The TypeScript package |
| D26 | `hypermarkdown` 0.2.0 on PyPI through the trusted publisher, verified by installing from the registry in a clean environment — `hmd 0.2.0`, `import hypermarkdown`, and both MkDocs entry-point keys resolving, so the compatibility alias holds on a genuinely published wheel | The Python distribution, its module, and the project left behind |
| D25 | DNS settled: the `hypermarkdown.org` apex resolves to exactly the four GitHub Pages addresses, the certificate issued, and all four serve HTTPS 200. `www` redirects to the apex, and the sitemap's every `<loc>` is under the new host. Closes W1 and W2 | The canonical host, and the state DNS has to reach |
| D24 | VS Marketplace publisher `hypermarkdown` created, so both galleries now carry the new namespace and the extension's identity is consistent end to end. The old `hyper-markdown` publisher is retained unused rather than released — a publisher name returned to the pool is one an impostor can register under. Closes W4 | The extension's identity on both galleries |
| D23 | `origin` repointed to the renamed repository. One worktree exists, so there is no second clone to follow | The repository and the URLs that point at it |

## TODO

### Planned work

One work point left, and it is the retired domain rather than the new one.

| ID | Work point | Blocked on |
| --- | --- | --- |
| W3 | Configure the path-preserving redirect from `hyper-markdown.org` to `hypermarkdown.org` | W1 |

### Broken

| ID | What is broken | Since |
| --- | --- | --- |
| ~~B1~~ | ~~The extension release is dead on arrival: it publishes to an Open VSX namespace that does not exist.~~ **Fixed** 2026-08-10 by D8. The manifest now names `hypermarkdown`, which is the namespace that exists | fixed |
| ~~B2~~ | ~~The Python release is dead on arrival: the PyPI trusted publisher names a repository that no longer exists under that name.~~ **Fixed** 2026-08-10 by D9 and D11 together — a publisher was registered against the new repository, and the wheel is now built under the project name that publisher authorises. Either half alone would still have failed | fixed |
| ~~B3~~ | ~~`https://hypermarkdown.org/` fails TLS: two non-GitHub A records sit alongside the four Pages ones.~~ **Fixed** 2026-08-10 by D25. The apex carries only the Pages addresses and all four serve 200 | fixed |
| B4 | `hyper-markdown.org` answers 404. It no longer resolves to GitHub Pages — its records now point at a forwarding service, so the registrar side is half-configured — but neither address redirects, so the forwarding *rule* is absent or has not taken effect. Every link published under the old host is still dead | the Pages custom domain moved |

### Limitations

| ID | Limitation | Why it stands |
| --- | --- | --- |
| L1 | `pip install hyper-markdown` keeps installing 0.1.1 forever | PyPI has no rename and no way to point a project at a successor. Abandoning is the only available shape; the alternative was keeping the old name permanently |
| L2 | The `hyper-markdown` MkDocs entry-point key survives as an alias | It appears in `mkdocs.yml` files this project does not own, where removing it is a hard build failure whose cause is invisible to the site's author. Withdrawal is Q1 |
| L3 | The wiki card's URL changes from `/wiki/hyper-markdown/` to `/wiki/hypermarkdown/`, and the domain redirect does not repair it | The redirect preserves paths across a host change; here the path itself changed. Accepted because the card is days old with no established inbound links |
| L4 | `hyperMarkdown.*` settings and command IDs keep a spelling that no longer matches any package name | Renaming a settings key silently discards the user's existing value rather than migrating it. The camelCase form already reads as the new name, so the cost is cosmetic and the alternative is not |
| L5 | Changelog entries keep the old name where they record what a release was actually called | A changelog is a historical record. Rewriting it would make it claim releases shipped under a name they did not have |
| L6 | The old Marketplace publisher and the unregistered `@hyper-markdown` npm scope are both left as-is rather than tidied | Releasing a publisher name back into the pool lets an impostor take it; registering and unpublishing an npm scope is strictly worse than never registering it. Deliberate inaction, not an oversight |

### Open questions and blockers

None of these block the rename itself; every one blocks `drafted → accepted`.

**This table is the only copy.** [The record](README.md#open-questions) points
here rather than mirroring the list.

| ID | Question |
| --- | --- |
| Q1 | When is the `hyper-markdown` entry-point alias withdrawn, and what announces it — a major version, a deprecation warning emitted at build time, or nothing? |
| Q2 | Does pruning the abandoned PyPI project mean yanking its releases or deleting it outright? Deletion frees the name for anyone to register and serve to a stale pin, which argues for yanking and holding |
| ~~Q3~~ | ~~Does the plugin class track the prose capitalisation?~~ **Resolved** 2026-08-10: yes, `HyperMarkDownPlugin`. No user sees an internal symbol and nothing outside this repository names it, so the two workflow assertions were the whole cost |
| Q4 | Does the extension keep the name `hmd-vsc-ext`? The publisher is being decided under time pressure because it is immutable, and the second half of the ID is equally immutable and getting no such scrutiny |
| Q5 | Does `hyper-markdown.org` redirect permanently, or for a fixed window after which the registration is allowed to lapse? A lapsed domain that once served documentation is a domain someone else can serve anything from |
| Q6 | Should the specification's version sentence stop being the parse target for the repository guard, now that a rename has demonstrated the sentence can move? |

## Gates

```bash
uv sync --locked
uv run python -m pytest
uv build --package hypermarkdown
npm ci && npm run typecheck && npm run build && npm test
uv run mkdocs build --strict
```

Both release paths can be exercised without publishing: `workflow_dispatch` on
`release-vsc-ext.yml` runs every gate and publishes nowhere, and `release.yml`'s
TestPyPI dispatch does the same for the wheel. Both MUST be run green before
either tag is pushed, since W4 and W5 fail only at publish time.

## Changelog

- 2026-08-10: drafted alongside [the record](README.md). Live registry and DNS
  state established by probe; four naming decisions taken; B1–B4 recorded as
  pre-existing breakage the rename has to clear rather than as regressions it
  introduces.
- 2026-08-10: D8 landed and B1 cleared. The extension publisher is
  `hypermarkdown` and every reference to the extension ID moved with it. The
  Open VSX path is now correct end to end; the Marketplace still needs its
  publisher created (W4), and its job stays skipped until the gallery offers
  trusted publishing regardless.
- 2026-08-10: D9–D14 landed and B2 cleared. The Python line is renamed end to
  end — package directory, distribution, entry points, workflows, lockfile —
  and the compatibility alias is verified from an installed wheel rather than
  asserted. 239 tests pass, `mkdocs build --strict` is clean, and
  `uv build --package hypermarkdown` produces `hypermarkdown-0.1.1`. The
  release path is whole: a `v*` tag would now build and publish. What remains
  is npm (W9), the site and manifest URLs behind the certificate (W10, W11),
  and prose (W12–W14).
- 2026-08-10: D26 and D27 — both packages released and verified from their
  registries rather than from the build. The npm release took three runs, and
  the two failures are worth keeping: `npm pack --pack-destination` does not
  create its directory, which no local dry run could catch because every one of
  them made the directory first; and `npm install -g npm@latest` resolved to a
  major that refused to install on Node 20, in a repository that had already
  written down why a moving tag has no place in a release path. Both were caught
  by the build gate with nothing published, so the version was never burnt — the
  tag moved instead. The fix for the second removed the upgrade step rather than
  pinning it: Node 24 already ships an npm that can publish tokenlessly.
- 2026-08-10: D24 and D25. The Marketplace publisher exists, so both galleries
  carry the new namespace; DNS is settled and the site serves HTTPS on all four
  Pages addresses under the new name. An earlier reading of the apex showed two
  stray records still present and was wrong — that was a cached resolver, not
  the zone, and the authoritative answer had already been correct.
- 2026-08-10: D15–D23 landed; W9–W15 done and the repository half of the rename
  is complete. `0.2.0` is cut and ready to tag. The one decision reversed along
  the way is D18: the record had gated `site_url` on the certificate, which the
  facts inverted — the old value already names a host that 404s, so waiting
  preserved a broken canonical rather than protecting a working one. The guard
  added as D21 is the part worth keeping: a blanket replace produced eleven
  wrong identifiers, and the guard, not a reviewer, is what found them.
