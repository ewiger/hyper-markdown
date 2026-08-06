import { describe, expect, it } from "vitest";

import { mask, PositionIndex } from "../src/scan.js";
import { parse } from "../src/parse.js";

function links(text: string): string[] {
  return parse("a.hmd", text).links.map((l) => l.raw);
}

describe("masking", () => {
  it("hides links inside a fenced code block", () => {
    expect(links("```\n[[hidden]]\n```\n")).toEqual([]);
  });

  it("hides links inside a code span", () => {
    expect(links("text `[[hidden]]` more\n")).toEqual([]);
  });

  it("hides links inside an HTML comment", () => {
    expect(links("<!-- [[hidden]] -->\n")).toEqual([]);
  });

  it("does NOT hide a link in an indented block", () => {
    // HMD-0001 §1: under `admonition` and `footnotes` a four-space indent
    // marks a callout body, not code. Masking it would drop real links.
    expect(links("!!! note\n    see [[tokens]]\n")).toEqual(["[[tokens]]"]);
  });

  it("preserves offsets so spans still point at the source", () => {
    const text = "`code` and [[tokens]]\n";
    const masked = mask(text);
    expect(masked).toHaveLength(text.length);
    expect(masked.indexOf("[[tokens]]")).toBe(text.indexOf("[[tokens]]"));
  });

  it("treats an unterminated fence as running to end of file", () => {
    expect(links("```\n[[hidden]]\n")).toEqual([]);
  });

  it("keeps a code span from spanning a blank line", () => {
    expect(links("`open\n\n[[tokens]]`\n")).toEqual(["[[tokens]]"]);
  });
});

describe("PositionIndex", () => {
  it("reports 1-indexed line and column", () => {
    const text = "one\ntwo\nthree";
    const index = new PositionIndex(text);
    expect(index.at(0)).toEqual({ line: 1, column: 1 });
    expect(index.at(4)).toEqual({ line: 2, column: 1 });
    expect(index.at(6)).toEqual({ line: 2, column: 3 });
    expect(index.at(text.length - 1)).toEqual({ line: 3, column: 5 });
  });

  it("agrees with a linear scan on CRLF input", () => {
    const text = "a\r\nb\r\nc";
    const index = new PositionIndex(text);
    expect(index.at(3)).toEqual({ line: 2, column: 1 });
  });
});
