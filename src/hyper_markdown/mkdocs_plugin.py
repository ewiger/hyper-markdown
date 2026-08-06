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

from pathlib import Path

from mkdocs.config import config_options
from mkdocs.config.base import Config as BaseConfig
from mkdocs.exceptions import PluginError
from mkdocs.plugins import BasePlugin
from mkdocs.structure.files import File, Files

from . import config as config_mod
from . import urls
from .embed import expand
from .model import Link
from .parse import slug_for
from .resolve import Workspace


class PluginConfig(BaseConfig):
    root = config_options.Optional(config_options.Dir(exists=True))
    build_nav = config_options.Type(bool, default=True)


class HyperMarkdownPlugin(BasePlugin[PluginConfig]):
    """Collect `.hmd` pages, order them, expand them, rewrite their links."""

    def __init__(self) -> None:
        self.workspace: Workspace | None = None
        #: MkDocs source path (`a/b.md`) -> the `.hmd` page it came from.
        self.sources: dict[str, Path] = {}

    # -- collection ------------------------------------------------------

    def on_files(self, files: Files, /, *, config) -> Files:
        if not config.use_directory_urls:
            raise PluginError(
                "hyper-markdown requires use_directory_urls: true — a card and its "
                "folder note share one URL, which page.html cannot express"
            )

        root = Path(self.config.root) if self.config.root else Path(config.docs_dir)
        self.workspace = Workspace(config_mod.load(root_override=root))

        for path in self.workspace.pages():
            dest = urls.dest_for(self.workspace.root, path)
            self.sources[dest] = path
            files.append(
                File.generated(
                    config,
                    dest,
                    content=self.workspace.documents[path].text,
                )
            )

        if self.config.build_nav and not config.nav:
            config.nav = self._nav(files)
        return files

    # -- §2 nav ----------------------------------------------------------

    def _nav(self, files: Files) -> list:
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
        source = self.sources.get(page.file.src_uri)
        if source is None or self.workspace is None:
            return markdown

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

        return expand(self.workspace, source, rewrite=rewrite).text

    # -- serving ---------------------------------------------------------

    def on_serve(self, server, /, *, config, builder):
        """Watch the namespace root, which MkDocs would otherwise ignore."""
        if self.workspace is not None:
            server.watch(str(self.workspace.root))
        return server


def _titlecase(stem: str) -> str:
    return stem.replace("-", " ").replace("_", " ").strip().capitalize()
