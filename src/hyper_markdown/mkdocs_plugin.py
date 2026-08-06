"""The MkDocs plugin (HMD-0002).

MkDocs is consumed for the code it already provides. The plugin's whole job is
to make `.hmd` visible to a build and to write down what the resolver has
already decided — it never resolves anything a second time.

Three hooks carry it. `on_files` registers `.hmd` pages under `.md` names, since
MkDocs matches a fixed extension set. `on_nav`… is not used: nav is built in
`on_files` instead, because MkDocs needs the config's `nav` before it builds its
own. `on_page_markdown` expands embeds and rewrites links before Python-Markdown
runs, so `toc` and `footnotes` see one finished document.
"""

from __future__ import annotations

import posixpath
import re
from pathlib import Path

from mkdocs.config import config_options
from mkdocs.config.base import Config as BaseConfig
from mkdocs.exceptions import PluginError
from mkdocs.plugins import BasePlugin
from mkdocs.structure.files import File, Files

from . import config as config_mod
from . import scan, urls
from .embed import expand
from .model import Link
from .parse import slug_for
from .resolve import Workspace


#: A nav entry with this value is replaced by the derived wiki section, so an
#: authored book nav can say *where* the generated pages go.
NAV_PLACEHOLDER = "hmd://wiki"

#: An ordinary markdown link whose target is a `.hmd` file. Book pages and
#: proposals link to cards this way — a wikilink would not work from outside the
#: namespace, and the path they write is a real file in the repository.
_HMD_HREF_RE = re.compile(r"\]\((?P<href>[^)\s#]+\.hmd)(?P<fragment>#[^)\s]*)?\)")


class PluginConfig(BaseConfig):
    #: The namespace root. Defaults to `docs_dir`, but may name a subtree of it:
    #: a site can cover all of `doc/` while `[[…]]` stays restricted to
    #: `doc/wiki`, so a book and its wiki live in one build.
    root = config_options.Optional(config_options.Dir(exists=True))
    build_nav = config_options.Type(bool, default=True)


class HyperMarkdownPlugin(BasePlugin[PluginConfig]):
    """Collect `.hmd` pages, order them, expand them, rewrite their links."""

    def __init__(self) -> None:
        self.workspace: Workspace | None = None
        #: MkDocs source path (`a/b.md`) -> the `.hmd` page it came from.
        self.sources: dict[str, Path] = {}
        #: The `.hmd` page -> the MkDocs source path it was registered under.
        self.destinations: dict[Path, str] = {}
        #: Where the namespace root sits inside `docs_dir`, as a URL prefix.
        self.prefix = ""
        self.docs_dir: Path | None = None

    # -- collection ------------------------------------------------------

    def on_files(self, files: Files, /, *, config) -> Files:
        if not config.use_directory_urls:
            raise PluginError(
                "hyper-markdown requires use_directory_urls: true — a card and its "
                "folder note share one URL, which page.html cannot express"
            )

        self.docs_dir = docs_dir = Path(config.docs_dir).resolve()
        root = Path(self.config.root).resolve() if self.config.root else docs_dir
        self.workspace = Workspace(config_mod.load(root_override=root))
        self.prefix = _prefix(docs_dir, self.workspace.root)

        for path in self.workspace.pages():
            dest = self._dest(path)
            self.sources[dest] = path
            self.destinations[path] = dest
            files.append(
                File.generated(
                    config,
                    dest,
                    content=self.workspace.documents[path].text,
                )
            )

        if not self.config.build_nav:
            return files

        derived = self._nav()
        # An authored nav wins, except where it asks for the wiki by name. That
        # is the whole integration: a book keeps its own order and says where
        # the generated section belongs.
        config.nav = _splice(config.nav, derived) if config.nav else derived
        return files

    def _dest(self, path: Path) -> str:
        """The MkDocs source path a card is registered under, prefix included."""
        dest = urls.dest_for(self.workspace.root, path)
        return posixpath.join(self.prefix, dest) if self.prefix else dest

    # -- §2 nav ----------------------------------------------------------

    def _nav(self) -> list:
        """Derive the nav from the namespace tree.

        Ordering is `nav:` first, ascending, then root-relative path — which is
        deterministic and independent of filesystem iteration order (P1).
        """
        assert self.workspace is not None
        tree: dict = {}

        for dest, path in sorted(self.sources.items()):
            parts = urls.parts_for(self.workspace.root, path)
            node = tree
            for part in parts[:-1] if parts else ():
                node = node.setdefault(part, {})
            if len(parts) <= 1 and parts and parts[0] == urls.INDEX_STEM:
                node["__index__"] = dest
            elif self._is_folder_note(path):
                node.setdefault(parts[-1], {})["__index__"] = dest if parts else dest
            else:
                node[parts[-1] if parts else urls.INDEX_STEM] = dest

        return self._nav_items(tree)

    def _is_folder_note(self, path: Path) -> bool:
        return path.stem == urls.INDEX_STEM and path.parent != self.workspace.root

    def _order(self, dest: str) -> tuple[int, int, str]:
        """`nav:` first, ascending; then path. Absent `nav` sorts last."""
        nav = self.workspace.documents[self.sources[dest]].card.nav
        return (1, 0, dest) if nav is None else (0, nav, dest)

    def _nav_items(self, node: dict) -> list:
        items: list = []
        index = node.get("__index__")
        if index is not None:
            items.append({self._title(index): index})

        entries = [(key, value) for key, value in node.items() if key != "__index__"]
        entries.sort(key=lambda kv: self._order(kv[1]) if isinstance(kv[1], str) else (1, 0.0, kv[0]))

        for key, value in entries:
            if isinstance(value, str):
                items.append({self._title(value): value})
            else:
                items.append({_titlecase(key): self._nav_items(value)})
        return items

    def _title(self, dest: str) -> str:
        document = self.workspace.documents[self.sources[dest]]
        for heading in document.headings:
            if heading.level == 1:
                return heading.text
        return _titlecase(Path(dest).stem)

    # -- §3 expansion and rewriting --------------------------------------

    def on_page_markdown(self, markdown: str, /, *, page, config, files) -> str:
        """Expand embeds and rewrite links before Python-Markdown runs."""
        if self.workspace is None:
            return markdown

        source = self.sources.get(page.file.src_uri)
        if source is None:
            # Not a card. It may still link *to* one: a book page or a proposal
            # writes an ordinary relative link to a `.hmd` file, because a
            # wikilink does not work from outside the namespace.
            return self._link_to_cards(markdown, page.file.src_uri)

        root = self.workspace.root

        def rewrite(link: Link, target: Path | None) -> str:
            text = link.display or link.page_ref
            if target is None:
                # A red link keeps the build green and marks a page worth
                # writing later; lint tracks it as HMD001.
                return f'<a class="hmd-redlink" title="{link.target} does not resolve">{text}</a>'
            href = urls.href_for(root, source, target)
            if link.fragment is not None and link.fragment_kind == "heading":
                href = f"{href}#{slug_for(link.fragment, set())}"
            return f"[{text}]({href})"

        expanded = expand(self.workspace, source, rewrite=rewrite).text
        return self._link_to_cards(expanded, page.file.src_uri)

    def _link_to_cards(self, markdown: str, src_uri: str) -> str:
        """Point ordinary markdown links at the page a `.hmd` file becomes.

        The written path is a real file, which is what makes it work when the
        repository is browsed on its own. The built site does not serve `.hmd`
        sources, so the same link has to arrive at the rendered card instead of
        404ing.

        Masked first, so a `.hmd` path quoted inside a fence stays quoted.
        """
        masked = scan.mask(markdown)
        directory = posixpath.dirname(src_uri)
        out: list[str] = []
        cursor = 0

        for match in _HMD_HREF_RE.finditer(masked):
            dest = self._card_at(directory, match.group("href"))
            if dest is None:
                continue
            href = posixpath.relpath(dest, directory or ".")
            out.append(markdown[cursor : match.start()])
            out.append(f"]({href}{match.group('fragment') or ''})")
            cursor = match.end()

        out.append(markdown[cursor:])
        return "".join(out)

    def _card_at(self, directory: str, href: str) -> str | None:
        """The registered page for a `.hmd` link, or None if it is not a card."""
        if self.docs_dir is None or href.startswith(("http://", "https://", "/")):
            return None
        target = Path(posixpath.normpath(posixpath.join(directory, href)))
        return self.destinations.get((self.docs_dir / target).resolve())

    # -- serving ---------------------------------------------------------

    def on_serve(self, server, /, *, config, builder):
        """Watch the namespace root, which MkDocs would otherwise ignore."""
        if self.workspace is not None:
            server.watch(str(self.workspace.root))
        return server


def _prefix(docs_dir: Path, root: Path) -> str:
    """How far the namespace root sits below `docs_dir`, as a URL prefix.

    A root outside `docs_dir` gets no prefix: its pages are still generated, they
    simply land at the site root.
    """
    try:
        relative = root.relative_to(docs_dir).as_posix()
    except ValueError:
        return ""
    return "" if relative == "." else relative


def _splice(node, derived: list):
    """Replace every `hmd://wiki` in an authored nav with the derived section.

    As a mapping value it becomes that entry's children; as a list item it is
    spliced in place, so a section can hold hand-written pages beside generated
    ones.
    """
    if isinstance(node, list):
        out: list = []
        for item in node:
            if item == NAV_PLACEHOLDER:
                out.extend(derived)
            else:
                out.append(_splice(item, derived))
        return out
    if isinstance(node, dict):
        return {
            key: derived if value == NAV_PLACEHOLDER else _splice(value, derived)
            for key, value in node.items()
        }
    return node


def _titlecase(stem: str) -> str:
    return stem.replace("-", " ").replace("_", " ").strip().capitalize()
