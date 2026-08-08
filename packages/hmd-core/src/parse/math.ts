/**
 * Math, with `arithmatex`'s smart-dollar semantics (HMD-0020 §3.3).
 *
 * Sketch §4 pins the behaviour: the opening `$` must be followed by
 * non-whitespace and the closing `$` preceded by non-whitespace, so
 * "I have $2.00 and Bob has $10.00" needs no escaping. That rule is the whole
 * reason this is hand-written rather than taken from a plugin — most JavaScript
 * math plugins treat every `$` as a delimiter and mangle prose about money.
 *
 * KaTeX renders at parse time, so the webview receives finished HTML and needs
 * only the stylesheet and its fonts.
 */

import katex from "katex";
import type MarkdownIt from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";

const DOLLAR = 0x24;
const BACKSLASH = 0x5c;

function isWhitespace(code: number): boolean {
  return code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d;
}

/** Render one expression, degrading to the source rather than throwing. */
export function renderMath(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: "html",
      strict: false,
      trust: false,
    });
  } catch {
    const escaped = latex.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<code class="hmd-math-error">${escaped}</code>`;
  }
}

/** `$…$` and single-line `$$…$$`. */
function inlineMath(state: StateInline, silent: boolean): boolean {
  const { src, pos } = state;
  if (src.charCodeAt(pos) !== DOLLAR) return false;
  if (pos > 0 && src.charCodeAt(pos - 1) === BACKSLASH) return false;

  const display = src.charCodeAt(pos + 1) === DOLLAR;
  const open = display ? pos + 2 : pos + 1;

  // smart_dollar: the opening delimiter must be followed by non-whitespace.
  const first = src.charCodeAt(open);
  if (Number.isNaN(first) || isWhitespace(first)) return false;

  let scan = open;
  let close = -1;
  while (scan < state.posMax) {
    if (src.charCodeAt(scan) === BACKSLASH) {
      scan += 2;
      continue;
    }
    if (src.charCodeAt(scan) === DOLLAR) {
      if (display && src.charCodeAt(scan + 1) !== DOLLAR) {
        scan += 1;
        continue;
      }
      // …and the closing delimiter must be preceded by non-whitespace.
      if (!isWhitespace(src.charCodeAt(scan - 1))) {
        close = scan;
        break;
      }
    }
    if (src.charCodeAt(scan) === 0x0a) break; // inline math is single-line
    scan += 1;
  }

  if (close === -1 || close === open) return false;

  if (!silent) {
    const token = state.push(display ? "math_block_inline" : "math_inline", "", 0);
    token.markup = display ? "$$" : "$";
    token.content = src.slice(open, close);
  }

  state.pos = close + (display ? 2 : 1);
  return true;
}

/** A `$$` fence on its own line, closed by another. */
function blockMath(state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean {
  const start = state.bMarks[startLine]! + state.tShift[startLine]!;
  const max = state.eMarks[startLine]!;
  if (state.src.slice(start, max).trim() !== "$$") return false;
  if (silent) return true;

  let nextLine = startLine + 1;
  let closed = false;
  while (nextLine < endLine) {
    const lineStart = state.bMarks[nextLine]! + state.tShift[nextLine]!;
    if (state.src.slice(lineStart, state.eMarks[nextLine]!).trim() === "$$") {
      closed = true;
      break;
    }
    nextLine += 1;
  }

  const bodyEnd = closed ? nextLine : endLine;
  const token = state.push("math_block", "", 0);
  token.block = true;
  token.markup = "$$";
  token.map = [startLine, bodyEnd + (closed ? 1 : 0)];
  token.content = state.getLines(startLine + 1, bodyEnd, state.blkIndent, false);

  state.line = bodyEnd + (closed ? 1 : 0);
  return true;
}

export const mathPlugin = (md: MarkdownIt): void => {
  md.inline.ruler.before("escape", "hmd_math_inline", inlineMath);
  md.block.ruler.before("fence", "hmd_math_block", blockMath, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  md.renderer.rules["math_inline"] = (tokens, idx) =>
    renderMath(tokens[idx]!.content, false);
  md.renderer.rules["math_block_inline"] = (tokens, idx) =>
    renderMath(tokens[idx]!.content, true);
  md.renderer.rules["math_block"] = (tokens, idx) =>
    `<div class="hmd-math-block">${renderMath(tokens[idx]!.content, true)}</div>\n`;
};
