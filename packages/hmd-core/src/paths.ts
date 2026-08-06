/**
 * Path arithmetic over root-relative POSIX strings.
 *
 * The core never imports `node:path` (HMD-0020 §1), and the canonical
 * implementation's semantics come from `pathlib`, not from an OS. Both facts
 * point the same way: do the arithmetic here, on strings, deterministically.
 */

export const SUFFIX = ".hmd";
export const INDEX_STEM = "index";

/** Split a link ref or path into non-empty segments. */
export function split(ref: string): string[] {
  return ref.split("/").filter((part) => part !== "");
}

export function joinParts(parts: readonly string[]): string {
  return parts.join("/");
}

/** The directory holding `rel`, or "" for a top-level entry. */
export function dirnameRel(rel: string): string {
  const cut = rel.lastIndexOf("/");
  return cut === -1 ? "" : rel.slice(0, cut);
}

export function basenameRel(rel: string): string {
  const cut = rel.lastIndexOf("/");
  return cut === -1 ? rel : rel.slice(cut + 1);
}

/** Join a root-relative directory with further segments. */
export function joinRel(dir: string, ...parts: string[]): string {
  const all = dir === "" ? parts : [dir, ...parts];
  return all.filter((p) => p !== "").join("/");
}

/**
 * `PurePath.with_suffix(".hmd")`: replace the last extension, or add one.
 *
 * Replicated rather than simplified because the canonical resolver calls it,
 * so `[[v1.2]]` binds `v1.hmd` on both sides or on neither.
 */
export function withHmdSuffix(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot <= 0 ? `${name}${SUFFIX}` : `${name.slice(0, dot)}${SUFFIX}`;
}

/** Drop a single trailing extension, as `PurePath.with_suffix("")` does. */
export function stripSuffix(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot <= 0 ? name : name.slice(0, dot);
}

export interface Normalized {
  parts: string[];
  /** True when the path climbed above the namespace root. */
  escapes: boolean;
}

/**
 * Collapse `.` and `..` without touching the filesystem.
 *
 * Never resolves symlinks: a symlink must not be able to carry a target out of
 * the root (HMD-0001 §4).
 */
export function normalizeParts(parts: readonly string[]): Normalized {
  const out: string[] = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") {
      const last = out[out.length - 1];
      if (out.length > 0 && last !== "..") out.pop();
      else out.push("..");
      continue;
    }
    out.push(part);
  }
  return { parts: out, escapes: out[0] === ".." };
}

/** Root-relative parts of a page path, with the `.hmd` suffix removed. */
export function pageParts(rel: string): string[] {
  const parts = split(rel);
  const last = parts.pop();
  if (last !== undefined) parts.push(stripSuffix(last));
  return parts;
}

/** True when `dir` is an ancestor directory of `rel` (strictly above it). */
export function isUnder(dir: string, rel: string): boolean {
  if (dir === "") return true;
  return rel.startsWith(`${dir}/`);
}
