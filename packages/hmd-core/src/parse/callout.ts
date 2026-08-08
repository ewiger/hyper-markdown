/**
 * Callouts: `!!!` admonitions and `???` collapsible details (HMD-0020 §3.3).
 *
 * Written here rather than taken from a plugin because the two forms are one
 * grammar with one difference — whether the result collapses — and the
 * canonical stack implements them with two extensions, `admonition` and
 * `pymdownx.details`, that no JavaScript package covers together.
 *
 * The output shape follows Python-Markdown's `admonition`, so a card renders
 * the same in the preview and in a MkDocs build:
 *
 *   <div class="admonition note"><p class="admonition-title">Note</p>…</div>
 *   <details class="note" open><summary>Note</summary>…</details>
 */

import type MarkdownIt from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";

/** `!!! type "Optional title"` or `??? type` / `???+ type`. */
const MARKER_RE = /^(!!!|\?\?\?\+?)[ \t]+([A-Za-z0-9_-]+(?:[ \t]+[A-Za-z0-9_-]+)*)[ \t]*(?:"([^"]*)")?[ \t]*$/;

const INDENT = 4;

/** Title-case a bare type the way Python-Markdown's admonition does. */
function defaultTitle(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function calloutRule(state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean {
  const start = state.bMarks[startLine]! + state.tShift[startLine]!;
  const max = state.eMarks[startLine]!;

  // A callout marker never starts inside an indented context.
  if (state.sCount[startLine]! - state.blkIndent >= INDENT) return false;

  const line = state.src.slice(start, max);
  const match = MARKER_RE.exec(line);
  if (match === null) return false;
  if (silent) return true;

  const marker = match[1]!;
  const classes = match[2]!.split(/[ \t]+/);
  const type = classes[0] ?? "note";
  const title = match[3] ?? defaultTitle(type);
  const collapsible = marker.startsWith("???");
  const open = marker === "???+";

  // The body is every following line indented by at least four spaces, blank
  // lines included. This is the `admonition` extension's rule, and it is why
  // the scanner of HMD-0001 §1 must not mask indented blocks.
  let nextLine = startLine + 1;
  let lastContent = startLine;
  while (nextLine < endLine) {
    const isBlank = state.isEmpty(nextLine);
    if (!isBlank && state.sCount[nextLine]! - state.blkIndent < INDENT) break;
    if (!isBlank) lastContent = nextLine;
    nextLine += 1;
  }
  const bodyEnd = lastContent + 1;

  const oldParent = state.parentType;
  const oldLineMax = state.lineMax;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state.parentType = "callout" as any;
  state.lineMax = bodyEnd;

  const openToken = state.push(collapsible ? "callout_details_open" : "callout_open", collapsible ? "details" : "div", 1);
  openToken.markup = marker;
  openToken.block = true;
  openToken.map = [startLine, bodyEnd];
  openToken.attrSet("class", collapsible ? classes.join(" ") : ["admonition", ...classes].join(" "));
  if (collapsible && open) openToken.attrSet("open", "");

  const titleToken = state.push(
    collapsible ? "callout_summary_open" : "callout_title_open",
    collapsible ? "summary" : "p",
    1,
  );
  titleToken.block = true;
  titleToken.map = [startLine, startLine + 1];
  if (!collapsible) titleToken.attrSet("class", "admonition-title");

  const titleInline = state.push("inline", "", 0);
  titleInline.content = title;
  titleInline.map = [startLine, startLine + 1];
  titleInline.children = [];

  state.push(
    collapsible ? "callout_summary_close" : "callout_title_close",
    collapsible ? "summary" : "p",
    -1,
  );

  if (bodyEnd > startLine + 1) {
    const oldIndent = state.blkIndent;
    state.blkIndent += INDENT;
    state.md.block.tokenize(state, startLine + 1, bodyEnd);
    state.blkIndent = oldIndent;
  }

  state.push(
    collapsible ? "callout_details_close" : "callout_close",
    collapsible ? "details" : "div",
    -1,
  );

  state.parentType = oldParent;
  state.lineMax = oldLineMax;
  state.line = bodyEnd;
  return true;
}

export const calloutPlugin = (md: MarkdownIt): void => {
  md.block.ruler.before("fence", "hmd_callout", calloutRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
};
