import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BookOpen, NotebookPen } from "lucide-react";

const directory = path.dirname(fileURLToPath(import.meta.url));
await build({
  entryPoints: [path.join(directory, "../src/main.tsx")],
  outfile: path.join(directory, "../js/dictation-ui.js"),
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
  jsx: "automatic",
  alias: { "@": path.join(directory, "../src") },
  nodePaths: [path.join(directory, "node_modules")],
});
execFileSync(
  process.execPath,
  [
    path.join(directory, "node_modules/tailwindcss/lib/cli.js"),
    "-c",
    path.join(directory, "tailwind.config.cjs"),
    "-i",
    path.join(directory, "../src/tokens.css"),
    "-o",
    path.join(directory, "../css/dictation-ui.css"),
    "--minify",
  ],
  { stdio: "inherit" },
);
const css = readFileSync(path.join(directory, "../src/tokens.css"), "utf8");
const primaries = [...css.matchAll(/--primary:\s*([^;]+);/g)].map(
  (match) => match[1],
);
const svg = renderToStaticMarkup(
  React.createElement(BookOpen, { xmlns: "http://www.w3.org/2000/svg" }),
);
const theme = `<style>:root{--primary:${primaries[0]};color:var(--primary)}@media(prefers-color-scheme:dark){:root{--primary:${primaries[1]}}}</style>`;
writeFileSync(
  path.join(directory, "../icons/favicon.svg"),
  svg.replace(/(<svg[^>]*>)/, "$1" + theme),
);
writeFileSync(
  path.join(directory, "../js/dictation-nav-icon.js"),
  "export const icon = " +
    JSON.stringify(
      renderToStaticMarkup(
        React.createElement(NotebookPen, { "aria-hidden": true }),
      ),
    ) +
    ";\n",
);
writeFileSync(
  path.join(directory, "../css/dictation.css"),
  readFileSync(path.join(directory, "../src/components/ui/navigation.css")),
);
console.log(
  "Built the served dictation entrypoint, Tailwind stylesheet and token-driven favicon.",
);
