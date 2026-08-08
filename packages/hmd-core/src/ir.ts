/**
 * The document IR (HMD-0020 §7).
 *
 * Ordinary GFM content is an opaque HTML island; every hyper-markdown
 * construct survives as a typed node. That split is the whole design: the
 * renderer needs no markdown knowledge, and no consumer can lose an embed
 * boundary by treating it as text.
 */

import type { Span } from "./model.js";

/** Bumped whenever the shape below changes. A consumer seeing an unknown
 * version refuses to render rather than guessing — a stale webview after an
 * extension update is the ordinary case, not an exotic one.
 *
 * 2 — `DiagramBlock` joins the union (HMD-0022 §4). */
export const IR_VERSION = 2;

export type ResolutionState = "resolved" | "unresolved" | "ambiguous" | "escapes";

export interface FragmentRef {
  kind: "heading" | "block";
  value: string;
  slug: string | null;
}

export interface TargetRef {
  raw: string;
  form: "absolute" | "relative" | "bare";
  page: string;
  fragment: FragmentRef | null;
  display: string | null;
}

export interface ResolutionRef {
  state: ResolutionState;
  path: string | null;
  candidates: readonly string[];
}

export interface HtmlBlock {
  kind: "html";
  key: string;
  html: string;
  span: Span;
}

export interface EmbedBlock {
  kind: "embed";
  key: string;
  target: TargetRef;
  resolution: ResolutionRef;
  /** The expanded child, or null when the embed does not resolve. */
  document: DocumentIR | null;
  /** Why the child is null, when it is. */
  failure: string | null;
  depth: number;
  span: Span;
}

/**
 * A diagram fence (HMD-0022).
 *
 * Not an `HtmlBlock`: rendering it needs a subprocess, which the core cannot
 * run and which may not be installed, and neither fact survives being flattened
 * into an HTML string.
 */
export interface DiagramBlock {
  kind: "diagram";
  key: string;
  /** The fence info string's first word, lowercased. */
  language: string;
  /** The fence body, verbatim — carried whether or not it rendered. */
  source: string;
  /**
   * The rendered SVG as a `data:` URI, attached by a consumer that can run the
   * renderer. The core runs no processes and performs no I/O.
   */
  dataUri: string | null;
  /** Why there is no diagram: a missing engine, or a failed render. */
  failure: string | null;
  span: Span;
}

export type Block = HtmlBlock | EmbedBlock | DiagramBlock;

export interface HeadingRef {
  level: number;
  text: string;
  slug: string;
  line: number;
}

export interface DocumentIR {
  irVersion: number;
  /** Root-relative, POSIX separators. */
  path: string;
  /** Namespace segments, root first. */
  breadcrumb: readonly string[];
  frontmatter: Record<string, unknown>;
  headings: readonly HeadingRef[];
  anchors: readonly string[];
  blocks: readonly Block[];
}

export interface BacklinkEntry {
  path: string;
  line: number;
  kind: "link" | "embed";
  snippet: string;
}
