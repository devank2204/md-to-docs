const languages: Record<string, string> = {
  js: "babel",
  javascript: "babel",
  jsx: "babel",
  ts: "typescript",
  typescript: "typescript",
  tsx: "typescript",
  css: "css",
  scss: "scss",
  less: "less",
  html: "html",
  yaml: "yaml",
  yml: "yaml",
  markdown: "markdown",
  md: "markdown",
};
export const supportsCodeFormatting = (language: string) =>
  !!languages[language];
export async function formatCode(source: string, language: string) {
  const parser = languages[language];
  if (!parser)
    throw new Error("Formatting is not available for this language.");
  const prettier = await import("prettier/standalone");
  const plugins = [];
  if (parser === "babel" || parser === "typescript") {
    plugins.push(await import("prettier/plugins/estree"));
    plugins.push(
      parser === "typescript"
        ? await import("prettier/plugins/typescript")
        : await import("prettier/plugins/babel"),
    );
  } else if (["css", "scss", "less"].includes(parser))
    plugins.push(await import("prettier/plugins/postcss"));
  else if (parser === "html")
    plugins.push(await import("prettier/plugins/html"));
  else if (parser === "yaml")
    plugins.push(await import("prettier/plugins/yaml"));
  else plugins.push(await import("prettier/plugins/markdown"));
  return prettier.format(source, { parser, plugins, tabWidth: 2 });
}
