/**
 * The resolved graph and the reverse edge map (HMD-0021 §9, §10).
 *
 * Backlinks are a query against an index the workspace already maintains, not
 * a scan: "what links here" is the cheapest question a knowledge base can be
 * asked, and it should stay that way as the tree grows.
 */

import type { BacklinkEntry } from "./ir.js";
import type { Workspace } from "./workspace.js";

export interface GraphNode {
  path: string;
  namespace: string;
  tags: readonly string[];
  headings: number;
  autodiscovery: boolean;
}

export interface GraphEdge {
  source: string;
  target: string | null;
  kind: "link" | "embed";
  raw: string;
  outcome: string;
  phase: number | null;
  fragment: string | null;
  line: number;
  column: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraph(workspace: Workspace): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const path of workspace.pages()) {
    const document = workspace.documents.get(path);
    if (document === undefined) continue;
    const cut = path.lastIndexOf("/");
    nodes.push({
      path,
      namespace: cut === -1 ? "/" : path.slice(0, cut),
      tags: document.card.tags,
      headings: document.headings.length,
      autodiscovery: workspace.autodiscoveryEnabled(path),
    });

    for (const link of document.links) {
      const result = workspace.resolve(path, link.pageRef);
      edges.push({
        source: path,
        target: result.path,
        kind: link.isEmbed ? "embed" : "link",
        raw: link.raw,
        outcome: result.outcome,
        phase: result.phase,
        fragment: link.fragment,
        line: link.span.line,
        column: link.span.column,
      });
    }
  }

  nodes.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  edges.sort(
    (a, b) =>
      (a.source < b.source ? -1 : a.source > b.source ? 1 : 0) ||
      a.line - b.line ||
      a.column - b.column,
  );
  return { nodes, edges };
}

/** Every card with a resolved edge into `path`, with a one-line snippet. */
export function backlinks(workspace: Workspace, path: string): BacklinkEntry[] {
  const out: BacklinkEntry[] = [];

  for (const source of workspace.pages()) {
    if (source === path) continue;
    const document = workspace.documents.get(source);
    if (document === undefined) continue;
    const lines = document.text.split("\n");

    for (const link of document.links) {
      const result = workspace.resolve(source, link.pageRef);
      if (result.path !== path) continue;
      out.push({
        path: source,
        line: link.span.line,
        kind: link.isEmbed ? "embed" : "link",
        snippet: (lines[link.span.line - 1] ?? "").trim().slice(0, 200),
      });
    }
  }

  out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0) || a.line - b.line);
  return out;
}
