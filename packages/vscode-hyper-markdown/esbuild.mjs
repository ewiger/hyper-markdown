/**
 * Two bundles, two environments (HMD-0021 §12).
 *
 * `dist/extension.js` runs in the Node extension host and treats `vscode` as
 * external, because the host provides it. `media/webview.js` runs inside the
 * sandboxed webview as a plain IIFE — no module loader is available there, and
 * the CSP of §11 would refuse one anyway.
 */

import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { build, context } from "esbuild";

const watch = process.argv.includes("--watch");

/**
 * Copy KaTeX's stylesheet and its woff2 fonts into `media/katex/`.
 *
 * The CSP of HMD-0021 §11 forbids remote content, so the fonts have to be
 * local. Only woff2 is copied — every browser VS Code ships on has supported it
 * for years — and the stylesheet's `woff` and `ttf` sources are stripped so the
 * webview does not request files that are deliberately absent.
 */
async function copyKatex() {
  const require = createRequire(import.meta.url);
  const katexDist = dirname(require.resolve("katex/dist/katex.min.css"));
  const out = join("media", "katex");

  await mkdir(join(out, "fonts"), { recursive: true });

  const css = await readFile(join(katexDist, "katex.min.css"), "utf8");
  const woff2Only = css.replace(
    /url\([^)]*\.(?:woff|ttf)\)\s*format\("(?:woff|truetype)"\)(,\s*)?/g,
    "",
  );
  await writeFile(join(out, "katex.min.css"), woff2Only);

  const fonts = await readdir(join(katexDist, "fonts"));
  for (const font of fonts.filter((f) => f.endsWith(".woff2"))) {
    await cp(join(katexDist, "fonts", font), join(out, "fonts", font));
  }
}

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

await copyKatex();

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
