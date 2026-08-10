/**
 * Rendering `d2` fences (HMD-0022).
 *
 * `d2` is a command-line tool the project depends on. The extension runs it,
 * caches the result by source, and degrades to a labelled placeholder when it
 * is not installed — a diagram that is merely not drawn is not a defect in the
 * card and must not look like one.
 *
 * Bounds and cache size are shared with the Python line's `diagram.py`, so a
 * diagram refused in a site build is refused here for the same stated reason.
 */

import { execFile } from "node:child_process";

import {
  CACHE_ENTRIES,
  MAX_SOURCE_BYTES,
  RENDER_TIMEOUT_MS,
  diagramKey,
} from "@hypermarkdown/core";

/** The one exception to the shared timeout: the fallback may pull an image. */
const DOCKER_TIMEOUT_MS = 20_000;
const DOCKER_IMAGE = "terrastruct/d2:latest";

export interface DiagramResult {
  dataUri: string | null;
  failure: string | null;
}

interface Candidate {
  label: string;
  command: string;
  args: string[];
  timeoutMs: number;
}

const CANDIDATES: readonly Candidate[] = [
  { label: "d2", command: "d2", args: ["-", "-"], timeoutMs: RENDER_TIMEOUT_MS },
  {
    label: `docker run ${DOCKER_IMAGE}`,
    command: "docker",
    args: ["run", "--rm", "-i", DOCKER_IMAGE, "-", "-"],
    timeoutMs: DOCKER_TIMEOUT_MS,
  },
];

const MISSING =
  `no diagram renderer found — looked for \`d2\` on PATH, then \`docker run ${DOCKER_IMAGE}\``;

/**
 * Run one renderer.
 *
 * The source goes in on stdin and the SVG comes back on stdout: no shell
 * string, no temporary file named from user content, no argument built from a
 * card.
 */
function run(candidate: Candidate, source: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      candidate.command,
      candidate.args,
      { timeout: candidate.timeoutMs, maxBuffer: 32 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) reject(new Error(stderr.trim() || error.message));
        else resolve(stdout);
      },
    );
    child.on("error", reject);
    child.stdin?.end(source);
  });
}

export class DiagramEngine {
  /** Insertion-ordered, so the oldest entry is the first key. */
  private readonly cache = new Map<string, DiagramResult>();
  private candidate: Candidate | null | undefined;

  /** Forget every rendered diagram. Used when the engine setting changes. */
  clear(): void {
    this.cache.clear();
    this.candidate = undefined;
  }

  async render(source: string): Promise<DiagramResult> {
    const key = diagramKey(source);
    const hit = this.cache.get(key);
    if (hit !== undefined) {
      // Refresh recency: delete and reinsert moves it to the end.
      this.cache.delete(key);
      this.cache.set(key, hit);
      return hit;
    }

    const result = await this.renderUncached(source);
    this.cache.set(key, result);
    // An unbounded cache in a long-lived editor process is a leak with a slow
    // fuse, and 64 live diagrams in one session is not the case worth serving.
    while (this.cache.size > CACHE_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      this.cache.delete(oldest);
    }
    return result;
  }

  private async renderUncached(source: string): Promise<DiagramResult> {
    if (Buffer.byteLength(source, "utf8") > MAX_SOURCE_BYTES) {
      return { dataUri: null, failure: `diagram source exceeds ${MAX_SOURCE_BYTES / 1024} KiB` };
    }

    const candidate = await this.resolveCandidate(source);
    if (candidate === null) return { dataUri: null, failure: MISSING };

    try {
      const svg = await run(candidate, source);
      // An <img> with a data URI executes no script, which turns SVG injection
      // from a vulnerability into a rendering limitation (HMD-0022 §6).
      const base64 = Buffer.from(svg, "utf8").toString("base64");
      return { dataUri: `data:image/svg+xml;base64,${base64}`, failure: null };
    } catch (exc) {
      return { dataUri: null, failure: exc instanceof Error ? exc.message : String(exc) };
    }
  }

  /** Find a renderer once, then remember the answer for the session. */
  private async resolveCandidate(source: string): Promise<Candidate | null> {
    if (this.candidate !== undefined) return this.candidate;
    for (const candidate of CANDIDATES) {
      try {
        await run(candidate, source);
        this.candidate = candidate;
        return candidate;
      } catch (exc) {
        // A renderer that exists but rejects *this* diagram is still the
        // renderer; only a missing executable moves us to the next candidate.
        const message = exc instanceof Error ? exc.message : String(exc);
        if (!/ENOENT|not found|no such file/i.test(message)) {
          this.candidate = candidate;
          return candidate;
        }
      }
    }
    this.candidate = null;
    return null;
  }
}
