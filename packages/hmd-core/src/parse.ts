/**
 * Source text -> `ParsedDocument` (HMD-0001 §1, §2, §3) — a port of
 * `src/hyper_markdown/parse.py`.
 *
 * Parsing never throws on partial input (HMD-0020 §7). A buffer caught
 * mid-keystroke is the ordinary input here, not an error case: an unterminated
 * construct becomes a diagnostic and the rest of the card parses normally.
 */

import { parseCardConfig, parseYaml, splitFrontmatter } from "./frontmatter.js";
import {
  ERROR,
  emptyCardConfig,
  type Anchor,
  type CardConfig,
  type Diagnostic,
  type FragmentKind,
  type Heading,
  type Link,
  type ParsedDocument,
  type Span,
} from "./model.js";
import * as scan from "./scan.js";
import { slugFor } from "./slug.js";

export const SUFFIX = ".hmd";

/** Characters that may not appear literally in a link target (HMD-0001 §2). */
export const RESERVED_CHARS: ReadonlySet<string> = new Set(["[", "]", "|", "#", "^", "\n"]);

const BLOCK_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const HEADING_TEXT_RE = /^[ \t]{0,3}#{1,6}[ \t]+([\s\S]*?)[ \t]*$/;
const CLOSING_HASHES_RE = /[ \t]+#+[ \t]*$/;
const TRAILING_ANCHOR_RE = /[ \t]+\^[A-Za-z0-9][A-Za-z0-9_-]{0,63}[ \t]*$/;

/** Parse one `.hmd` file. `rel` is the root-relative path used in diagnostics. */
export function parse(rel: string, text: string): ParsedDocument {
  const diagnostics: Diagnostic[] = [];
  const { raw, bodyOffset } = splitFrontmatter(text);

  let frontmatter: Record<string, unknown> = {};
  let card: CardConfig = emptyCardConfig();

  if (raw !== null) {
    try {
      frontmatter = parseYaml(raw);
      const parsed = parseCardConfig(frontmatter);
      card = parsed.card;
      for (const [rule, message] of parsed.problems) {
        diagnostics.push({ rule, severity: ERROR, path: rel, line: 1, column: 1, message });
      }
    } catch (exc) {
      diagnostics.push({
        rule: "HMD009",
        severity: ERROR,
        path: rel,
        line: 1,
        column: 1,
        message: exc instanceof Error ? exc.message : String(exc),
      });
    }
  }

  // Mask the body only; frontmatter is YAML, not markdown. The prefix is
  // spaces rather than the original bytes, exactly as the canonical
  // implementation writes it — see the note on `maskedBody` below.
  const masked = " ".repeat(bodyOffset) + scan.mask(text.slice(bodyOffset));
  const index = new scan.PositionIndex(text);

  const headings = collectHeadings(text, masked, index);
  const anchors = collectAnchors(text, masked, index);
  const { links, diagnostics: linkDiagnostics } = collectLinks(text, masked, index, rel);
  diagnostics.push(...linkDiagnostics);

  return { path: rel, text, frontmatter, card, headings, anchors, links, diagnostics };
}

function spanAt(index: scan.PositionIndex, start: number, end: number): Span {
  const { line, column } = index.at(start);
  return { start, end, line, column };
}

function collectHeadings(
  text: string,
  masked: string,
  index: scan.PositionIndex,
): Heading[] {
  const used = new Set<string>();
  const out: Heading[] = [];
  for (const raw of scan.findHeadings(masked)) {
    // Slug from the ORIGINAL text: masking blanks inline code, and a heading
    // such as "## The `hmd` CLI" must slug from what the renderer sees.
    const original = text.slice(raw.start, raw.end);
    const m = HEADING_TEXT_RE.exec(original);
    let display = m ? m[1]! : raw.text;
    display = display.replace(CLOSING_HASHES_RE, "");
    display = display.replace(TRAILING_ANCHOR_RE, "").trim();
    out.push({
      level: raw.level,
      text: display,
      slug: slugFor(display, used),
      span: spanAt(index, raw.start, raw.end),
    });
  }
  return out;
}

function collectAnchors(text: string, masked: string, index: scan.PositionIndex): Anchor[] {
  return scan
    .findAnchors(masked)
    .map((raw) => ({ blockId: raw.blockId, span: spanAt(index, raw.start, raw.end) }));
}

function collectLinks(
  text: string,
  masked: string,
  index: scan.PositionIndex,
  rel: string,
): { links: Link[]; diagnostics: Diagnostic[] } {
  const links: Link[] = [];
  const diagnostics: Diagnostic[] = [];

  for (const found of scan.findLinks(masked)) {
    const span = spanAt(index, found.start, found.end);
    const raw = text.slice(found.start, found.end);
    let target: ParsedTarget;
    try {
      target = parseTarget(found.inner);
    } catch (exc) {
      diagnostics.push({
        rule: "HMD010",
        severity: ERROR,
        path: rel,
        line: span.line,
        column: span.column,
        message: `${exc instanceof Error ? exc.message : String(exc)} in ${raw}`,
      });
      continue;
    }
    links.push({ ...target, isEmbed: found.isEmbed, raw, span });
  }

  for (const start of scan.findUnterminated(masked)) {
    const { line, column } = index.at(start);
    diagnostics.push({
      rule: "HMD010",
      severity: ERROR,
      path: rel,
      line,
      column,
      message: "unterminated '[[' — expected ']]'",
    });
  }

  return { links, diagnostics };
}

interface ParsedTarget {
  pageRef: string;
  fragment: string | null;
  fragmentKind: FragmentKind | null;
  display: string | null;
}

/**
 * Split a link body into its parts, throwing for anything malformed (HMD010).
 */
export function parseTarget(inner: string): ParsedTarget {
  if (inner.trim() === "") throw new Error("empty link target");

  // Display text comes last and may itself contain '|', so split once only.
  let rest = inner;
  let display: string | null = null;
  const bar = rest.indexOf("|");
  if (bar !== -1) {
    display = rest.slice(bar + 1);
    rest = rest.slice(0, bar);
    if (display.trim() === "") throw new Error("empty display text");
  }

  let fragment: string | null = null;
  let fragmentKind: FragmentKind | null = null;
  const hash = rest.indexOf("#");
  if (hash !== -1) {
    fragment = rest.slice(hash + 1);
    rest = rest.slice(0, hash);
    if (fragment.startsWith("^")) {
      fragmentKind = "block";
      fragment = fragment.slice(1);
      if (!BLOCK_ID_RE.test(fragment)) {
        throw new Error(`invalid block id '${fragment}'`);
      }
    } else {
      fragmentKind = "heading";
      if (fragment.trim() === "") throw new Error("empty heading fragment");
    }
  }

  const pageRef = rest.trim();
  if (pageRef === "") {
    // Covers `[[#tag]]`: a tag is never a link target, because '#' is
    // reserved for fragments (HMD-0001 §5.3).
    throw new Error("link target has no page reference");
  }

  const bad = [...new Set([...pageRef].filter((c) => RESERVED_CHARS.has(c)))].sort();
  if (bad.length > 0) {
    throw new Error(`reserved character '${bad.join("")}' in target`);
  }

  return { pageRef, fragment, fragmentKind, display };
}
