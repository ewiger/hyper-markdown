/**
 * The message boundary and the shell (HMD-0021 §4, §11).
 */

import { describe, expect, it } from "vitest";

import { buildShell, makeNonce } from "../src/preview/html.js";
import { isSafeRelativePath, parseWebviewMessage } from "../src/protocol.js";
import { suggestedPath } from "../src/commands/createCard.js";

describe("inbound messages", () => {
  it("accepts the shapes the webview sends", () => {
    expect(parseWebviewMessage({ type: "ready" })).toEqual({ type: "ready" });
    expect(parseWebviewMessage({ type: "scrolled", line: 12 })).toEqual({
      type: "scrolled",
      line: 12,
    });
    expect(parseWebviewMessage({ type: "openTarget", path: "a.hmd", fragment: "x" })).toEqual({
      type: "openTarget",
      path: "a.hmd",
      fragment: "x",
    });
    expect(parseWebviewMessage({ type: "modeChanged", mode: "backlinks" })).toEqual({
      type: "modeChanged",
      mode: "backlinks",
    });
  });

  it("rejects anything malformed rather than throwing", () => {
    for (const bad of [
      null,
      undefined,
      42,
      "ready",
      {},
      { type: "nope" },
      { type: "openSource", path: 5, line: 1 },
      { type: "scrolled", line: "twelve" },
      { type: "modeChanged", mode: "graph" },
      { type: "createCard" },
    ]) {
      expect(parseWebviewMessage(bad)).toBeNull();
    }
  });
});

describe("path safety", () => {
  it("accepts a root-relative card path", () => {
    expect(isSafeRelativePath("specs/auth/login.hmd")).toBe(true);
  });

  it("rejects traversal, absolutes, and separators that are not '/'", () => {
    for (const bad of [
      "",
      "/etc/passwd",
      "../secrets.hmd",
      "specs/../../out.hmd",
      "specs\\auth.hmd",
      "a\0b.hmd",
    ]) {
      expect(isSafeRelativePath(bad)).toBe(false);
    }
  });
});

describe("content security policy", () => {
  const shell = buildShell({
    scriptUri: "vscode-resource://media/webview.js",
    styleUri: "vscode-resource://media/webview.css",
    cspSource: "vscode-resource://self",
    nonce: "deadbeef",
  });

  it("forbids everything by default and grants no network access", () => {
    expect(shell).toContain("default-src 'none'");
    expect(shell).not.toContain("connect-src");
  });

  it("admits script only under the nonce, and stamps every script tag with it", () => {
    expect(shell).toContain("script-src 'nonce-deadbeef'");
    const scripts = [...shell.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
    expect(scripts.length).toBeGreaterThan(0);
    for (const tag of scripts) expect(tag).toContain('nonce="deadbeef"');
  });

  it("mints a fresh nonce per load", () => {
    expect(makeNonce()).not.toBe(makeNonce());
    expect(makeNonce()).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("create-card path derivation", () => {
  it("puts a bare name beside the card that links to it", () => {
    expect(suggestedPath("specs/auth/login.hmd", "tokens")).toBe("specs/auth/tokens.hmd");
  });

  it("puts an absolute name at the root", () => {
    expect(suggestedPath("specs/auth/login.hmd", "/shared/tokens")).toBe("shared/tokens.hmd");
  });

  it("declines a target it cannot place", () => {
    expect(suggestedPath("a.hmd", "../up")).toBeNull();
    expect(suggestedPath("a.hmd", "page#Section")).toBeNull();
  });
});
