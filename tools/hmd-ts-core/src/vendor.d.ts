/**
 * Ambient declarations for markdown-it plugins that ship no types.
 *
 * Typed as plugin functions rather than `any` so a wrong `md.use` call is still
 * a compile error.
 */

declare module "markdown-it-footnote" {
  import type MarkdownIt from "markdown-it";
  const plugin: MarkdownIt.PluginSimple;
  export default plugin;
}

declare module "markdown-it-task-lists" {
  import type MarkdownIt from "markdown-it";
  const plugin: MarkdownIt.PluginWithOptions<{ enabled?: boolean; label?: boolean }>;
  export default plugin;
}
