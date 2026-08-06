/**
 * Heading slugs (HMD-0001 §3, HMD-0020 §4).
 *
 * A reimplementation of Python-Markdown's `toc.slugify` and `toc.unique`. The
 * canonical implementation delegates to that extension so a link and its
 * rendered destination cannot disagree; this side has to reproduce it exactly
 * instead, which makes the slugger the most conformance-sensitive function in
 * the package.
 */

const NON_ASCII_RE = /[^\x00-\x7F]/g;
const NON_WORD_RE = /[^\w\s-]/g;
const SEPARATOR_RUN_RE = /[-\s]+/g;
const ID_COUNT_RE = /^(.*)_([0-9]+)$/;

/**
 * `markdown.extensions.toc.slugify(value, "-")`, step for step:
 *
 * 1. NFKD-normalise
 * 2. drop every code point above U+007F
 * 3. delete every character outside [A-Za-z0-9_\s-]
 * 4. trim, then lowercase
 * 5. collapse every run of [-\s]+ to a single "-"
 */
export function slugify(value: string): string {
  const folded = value.normalize("NFKD").replace(NON_ASCII_RE, "");
  const cleaned = folded.replace(NON_WORD_RE, "").trim().toLowerCase();
  return cleaned.replace(SEPARATOR_RUN_RE, "-");
}

/**
 * `markdown.extensions.toc.unique`: deduplicate within one page by appending
 * `_1`, `_2`, … in document order, mutating `used`.
 *
 * The empty-slug case loops too — a heading of only punctuation slugs to "" and
 * becomes "_1" — which is what the canonical implementation does.
 */
export function unique(id: string, used: Set<string>): string {
  let candidate = id;
  while (used.has(candidate) || candidate === "") {
    const m = ID_COUNT_RE.exec(candidate);
    candidate = m ? `${m[1]}_${Number.parseInt(m[2]!, 10) + 1}` : `${candidate}_1`;
  }
  used.add(candidate);
  return candidate;
}

/** Assign a heading slug the way the `toc` extension does. */
export function slugFor(text: string, used: Set<string>): string {
  return unique(slugify(text), used);
}
