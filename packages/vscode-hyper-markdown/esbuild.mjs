/**
 * Two bundles, two environments (HMD-0021 §12).
 *
 * `dist/extension.js` runs in the Node extension host and treats `vscode` as
 * external, because the host provides it. `media/webview.js` runs inside the
 * sandboxed webview as a plain IIFE — no module loader is available there, and
 * the CSP of §11 would refuse one anyway.
 */

import { build, context } from "esbuild";

const watch = process.argv.includes("--watch");

const shared = {
  bundle: true,
  sourcemap: true,
  minify: !watch,
  logLevel: "info",
  target: "node20",
};

const configs = [
  {
    ...shared,
    entryPoints: ["src/extension.ts"],
    outfile: "dist/extension.js",
    platform: "node",
    format: "cjs",
    external: ["vscode"],
  },
  {
    ...shared,
    entryPoints: ["media/webview.ts"],
    outfile: "media/webview.js",
    platform: "browser",
    format: "iife",
    target: "es2022",
  },
];

if (watch) {
  await Promise.all(
    configs.map(async (config) => {
      const ctx = await context(config);
      await ctx.watch();
    }),
  );
} else {
  await Promise.all(configs.map((config) => build(config)));
}
