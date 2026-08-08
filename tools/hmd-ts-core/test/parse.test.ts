import { describe, expect, it } from "vitest";

import { parse, parseTarget } from "../src/parse.js";
import { slugFor, slugify, unique } from "../src/slug.js";

describe("grammar", () => {
  it("parses every part of a full target", () => {
    expect(parseTarget("specs/auth/login#Rotation|the window")).toEqual({
      pageRef: "specs/auth/login",
      fragment: "Rotation",
      fragmentKind: "heading",
      display: "the window",
    });
  });

  it("parses a block reference", () => {
    expect(parseTarget("token#^definition")).toMatchObject({
      pageRef: "token",
      fragment: "definition",
      fragmentKind: "block",
    });
  });

  it("rejects an empty display", () => {
    expect(() => parseTarget("Page|")).toThrow(/empty display text/);
  });

  it("rejects a target that is only a fragment", () => {
    expect(() => parseTarget("#tag")).toThrow(/no page reference/);
  });

  it("rejects a reserved character in a target", () => {
    expect(() => parseTarget("a^b")).toThrow(/reserved character/);
  });

  it("accepts a 64-character block id and rejects 65", () => {
    const ok = "a".repeat(64);
    expect(parseTarget(`p#^${ok}`).fragment).toBe(ok);
    expect(() => parseTarget(`p#^${"a".repeat(65)}`)).toThrow(/invalid block id/);
  });

  it("reports an unterminated link as HMD010", () => {
    const doc = parse("a.hmd", "see [[tokens\n");
    expect(doc.diagnostics.map((d) => d.rule)).toEqual(["HMD010"]);
    expect(doc.diagnostics[0]!.message).toMatch(/unterminated/);
  });

  it("never throws on partial input", () => {
    // Every truncation of a card is a state the author types through.
    const source = "---\ntags: [a]\n---\n\n# H\n\nsee [[tokens#^id|x]] and ![[other]]\n";
    for (let i = 0; i <= source.length; i += 1) {
      expect(() => parse("a.hmd", source.slice(0, i))).not.toThrow();
    }
  });
});

describe("frontmatter", () => {
  it("reads the reserved keys", () => {
    const doc = parse(
      "a.hmd",
      "---\ntags: [area/auth]\nuse: [no_autodiscovery]\nimport:\n  - from /shared import tokens as t\n---\n\n# H\n",
    );
    expect(doc.card.tags).toEqual(["area/auth"]);
    expect(doc.card.use).toEqual({ autodiscovery: false });
    expect(doc.card.imports[0]).toMatchObject({ ref: "/shared", wildcard: false });
    expect(doc.diagnostics).toEqual([]);
  });

  it("reports invalid YAML as HMD009", () => {
    const doc = parse("a.hmd", "---\n: :\n---\n\n# H\n");
    expect(doc.diagnostics[0]!.rule).toBe("HMD009");
  });

  it("reports an unknown `use` feature as HMD013", () => {
    const doc = parse("a.hmd", "---\nuse: [no_autodiscovry]\n---\n\n# H\n");
    expect(doc.diagnostics[0]!.rule).toBe("HMD013");
  });

  it("treats an unterminated fence as no frontmatter", () => {
    const doc = parse("a.hmd", "---\ntags: [a]\n\n# H\n");
    expect(doc.frontmatter).toEqual({});
  });
});

describe("slugs", () => {
  it("matches the toc extension on ASCII", () => {
    expect(slugify("The `hmd` CLI")).toBe("the-hmd-cli");
    expect(slugify("A/B testing!")).toBe("ab-testing");
  });

  it("folds Extended Latin to ASCII", () => {
    expect(slugify("Žlutý kůň")).toBe("zluty-kun");
  });

  it("drops a heading that slugs to nothing, then numbers it", () => {
    const used = new Set<string>();
    expect(slugFor("!!!", used)).toBe("_1");
  });

  it("deduplicates in document order", () => {
    const used = new Set<string>();
    expect(slugFor("Notes", used)).toBe("notes");
    expect(slugFor("Notes", used)).toBe("notes_1");
    expect(slugFor("Notes", used)).toBe("notes_2");
  });

  it("increments an existing numeric suffix", () => {
    const used = new Set(["a_1"]);
    expect(unique("a_1", used)).toBe("a_2");
  });

  it("slugs headings from the original text, not the masked copy", () => {
    const doc = parse("a.hmd", "## The `hmd` CLI\n");
    expect(doc.headings[0]!.slug).toBe("the-hmd-cli");
  });
});

describe("anchors", () => {
  it("finds a trailing block anchor", () => {
    const doc = parse("a.hmd", "A token is a bearer credential. ^definition\n");
    expect(doc.anchors.map((a) => a.blockId)).toEqual(["definition"]);
  });

  it("keeps the anchor out of the heading text", () => {
    const doc = parse("a.hmd", "## Rotation ^rot\n");
    expect(doc.headings[0]!.text).toBe("Rotation");
  });
});
