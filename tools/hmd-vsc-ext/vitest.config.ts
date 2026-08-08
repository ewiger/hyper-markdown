import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * The renderer runs under jsdom, and `vscode` resolves to a stub.
 *
 * Neither substitution is a compromise: `render.ts` is pure DOM by design
 * (HMD-0021 §5), and the modules that do touch the editor API are tested for
 * the parts that do not — path derivation, message validation, the CSP.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    alias: {
      vscode: fileURLToPath(new URL("./test/stubs/vscode.ts", import.meta.url)),
    },
  },
});
