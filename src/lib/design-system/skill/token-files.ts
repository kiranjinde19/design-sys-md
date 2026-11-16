/**
 * The two token downloads: tokens.css (CSS custom properties, light mode only) and tokens.json (the W3C design tokens format).
 *
 * Both are made from exactly the lines of the `:root` block in the plain HTML and CSS file (the same code writes both), so they
 * can not hold a value the file does not. tokens.json is written from the parsed tokens.css declarations, so the two exports
 * agree with each other too. A test (scripts/roundtrip-test.mjs) compares them with the generated file for every stack.
 *
 * W3C format notes: colors are 6 digit hex; sizes are "16px" or "1rem" strings; letter spacing keeps its em unit as written
 * (the format only lists px and rem); font families are arrays; a reference to another token is written {path.to.token};
 * shadows are lists of layers; the hover transition (`--t-hover`) is only in tokens.css, because the format has no token type
 * for a transition over several properties. Its parts (the durations and the easing) are in both.
 */

import { PLINTH_VERSION, PLINTH_VERSION_DATE } from "../version";
import type { DesignSystem } from "../types";
import { createContext, tightCss } from "./context";
import { ROLE_NAMES, plainRootLines } from "./tokens";

export type TokenType = "color" | "dimension" | "fontFamily" | "duration" | "cubicBezier" | "shadow";

/** One custom property of tokens.css, as written in the generated file. */
export interface TokenDeclaration {
  name: string;
  value: string;
}

export interface TokenFiles {
  css: string;
  json: string;
  declarations: TokenDeclaration[];
}

const COLOR_SCALES = ["brand", "neutral", "secondary", "success", "warning", "error", "info"];
/** Tokens that are in tokens.css only (see the notes above). */
export const CSS_ONLY_TOKENS = ["--t-hover"];

/** Where a custom property goes in tokens.json, and its type. */
export function tokenPath(name: string): { path: string[]; type: TokenType } {
  const n = name.replace(/^--/, "");
  const scale = n.match(new RegExp(`^(${COLOR_SCALES.join("|")})-(\\d+)$`));
  if (scale) return { path: ["color", scale[1], scale[2]], type: "color" };
  if (ROLE_NAMES.includes(n)) return { path: ["color", "role", n], type: "color" };
  let m: RegExpMatchArray | null;
  if ((m = n.match(/^font-(heading|body|mono)$/))) return { path: ["font", "family", m[1]], type: "fontFamily" };
  if ((m = n.match(/^text-(.+)$/))) return { path: ["font", "size", m[1]], type: "dimension" };
  if ((m = n.match(/^leading-(.+)$/))) return { path: ["font", "lineHeight", m[1]], type: "dimension" };
  if ((m = n.match(/^tracking-(.+)$/))) return { path: ["font", "letterSpacing", m[1]], type: "dimension" };
  if ((m = n.match(/^radius-(.+)$/))) return { path: ["radius", m[1]], type: "dimension" };
  if ((m = n.match(/^shadow-(.+)$/))) return { path: ["shadow", m[1]], type: "shadow" };
  if ((m = n.match(/^space-(.+)$/))) return { path: ["space", m[1]], type: "dimension" };
  if ((m = n.match(/^t-(fast|base|slow)$/))) return { path: ["motion", "duration", m[1]], type: "duration" };
  if (n === "ease") return { path: ["motion", "easing", "standard"], type: "cubicBezier" };
  return { path: ["size", n], type: "dimension" };
}

/** Splits at commas that are not inside brackets or quotes. */
function splitTop(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = "";
  let current = "";
  for (const ch of value) {
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const longHex = (hex: string) => (hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex).toUpperCase();
const dimension = (value: string) => {
  if (value === "0") return "0px";
  return value.replace(/^(-?)\./, "$10.");
};

/** The value of a token in the W3C format. A `var(--other)` becomes a reference to that token. */
function toJsonValue(name: string, type: TokenType, value: string): unknown {
  const reference = value.match(/^var\((--[\w-]+)\)$/);
  if (reference) return `{${tokenPath(reference[1]).path.join(".")}}`;
  switch (type) {
    case "color":
      return longHex(value);
    case "dimension":
      return dimension(value);
    case "duration":
      return value;
    case "fontFamily":
      return splitTop(value).map((family) => family.replace(/^["']|["']$/g, ""));
    case "cubicBezier":
      return value.replace(/^cubic-bezier\(|\)$/g, "").split(",").map((n) => Number(n));
    case "shadow":
      return splitTop(value).map((layer) => {
        const m = layer.match(/^(-?[\d.]+)(?:px)? (-?[\d.]+)(?:px)? (-?[\d.]+)(?:px)? (-?[\d.]+)(?:px)? (.+)$/);
        if (!m) throw new Error(`token ${name}: can not read the shadow layer "${layer}"`);
        return { color: m[5], offsetX: `${Number(m[1])}px`, offsetY: `${Number(m[2])}px`, blur: `${Number(m[3])}px`, spread: `${Number(m[4])}px` };
      });
  }
}

/** The custom properties of a `:root` block, in order, as the generated file writes them. */
export function parseDeclarations(rootCss: string): TokenDeclaration[] {
  const body = rootCss.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[\s\S]*?:root\s*\{/, "").replace(/\}[\s\S]*$/, "");
  return body
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const cut = part.indexOf(":");
      return { name: part.slice(0, cut).trim(), value: part.slice(cut + 1).trim() };
    });
}

export function generateTokenFiles(ds: DesignSystem): TokenFiles {
  const ctx = createContext(ds, { stack: "html-css", name: ds.settings.project.name, description: ds.settings.project.description });
  // The very text of the file's :root block (compacted the same way), parsed back into declarations.
  const declarations = parseDeclarations(tightCss(plainRootLines(ctx)).join("\n"));

  const css = [
    `/* Plinth tokens${ds.settings.project.name ? ` for ${ds.settings.project.name}` : ""}. Light mode only. The same values as the design system file. Made with Plinth ${PLINTH_VERSION}, ${PLINTH_VERSION_DATE}. */`,
    ":root {",
    ...declarations.map(({ name, value }) => `  ${name}: ${value};`),
    "}",
    "@media (prefers-reduced-motion: reduce) { :root { --t-fast: 0ms; --t-base: 0ms; --t-slow: 0ms; } }",
    "",
  ].join("\n");

  const tree: Record<string, unknown> = {
    $description: `Plinth design tokens${ds.settings.project.name ? ` for ${ds.settings.project.name}` : ""}, light mode only. Made with Plinth ${PLINTH_VERSION}, ${PLINTH_VERSION_DATE}.`,
  };
  for (const { name, value } of declarations) {
    if (CSS_ONLY_TOKENS.includes(name)) continue;
    const { path, type } = tokenPath(name);
    let node = tree;
    for (const key of path.slice(0, -1)) node = (node[key] ??= {}) as Record<string, unknown>;
    node[path[path.length - 1]] = { $type: type, $value: toJsonValue(name, type, value) };
  }
  return { css, json: JSON.stringify(tree, null, 2) + "\n", declarations };
}
