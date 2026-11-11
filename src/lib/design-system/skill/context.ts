/**
 * Shared helpers for the skill file templates.
 *
 * The rule for every template: values come from the design system object. Colors are written
 * by token name (bg-primary, var(--ring)), never as hex, so a color is looked up by its value
 * and printed as the name of the token that holds it.
 */

import { contrastRatio } from "../contrast";
import { generateSpacing } from "../spacing";
import { MIN_FONT_SIZE } from "../typography";
import { nearestWeight } from "../fonts";
import type {
  ColorScale,
  ControlStateStyle,
  CssRecipe,
  DesignSystem,
  DesignSystemSettings,
  DesignSystemTokens,
  Density,
  ScaleStep,
  SemanticName,
  StackId,
} from "../types";
import { SCALE_STEPS } from "../types";

export interface SkillOptions {
  stack: StackId;
  /** Product name. Empty means the file is written for "this product". */
  name: string;
  /** One line describing the product. */
  description: string;
}

export const STACK_LABELS: Record<StackId, string> = {
  "next-tailwind-shadcn": "Next.js + Tailwind CSS + shadcn/ui",
  "react-tailwind": "React + Tailwind CSS",
  "html-css": "Plain HTML and CSS",
};

const RESERVED_SKILL_NAMES = ["synced", "anthropic-skills"];

/** A skill folder name: lowercase letters, numbers and hyphens, at most 64 characters. */
export function skillSlug(productName: string): string {
  const base = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const slug = base ? `${base}-design-system` : "design-system";
  return RESERVED_SKILL_NAMES.includes(slug) ? `${slug}-skill` : slug;
}

/**
 * How a color is used. Two tokens can hold the same color (the neutral that is both the
 * secondary fill and the border), so the use decides which name is written.
 */
export type ColorUse = "fill" | "border" | "text";

const PREFERRED: Record<ColorUse, string[]> = {
  fill: ["primary", "destructive", "secondary", "muted", "accent", "background", "card", "popover", "primary-foreground"],
  border: ["input", "border", "card-border", "ring", "primary", "destructive"],
  text: ["foreground", "muted-foreground", "primary-foreground", "destructive-foreground", "primary", "placeholder"],
};

/** The use implied by a Tailwind prefix such as "hover:bg" or "border" or "placeholder:text". */
export function colorUseForPrefix(prefix: string): ColorUse | undefined {
  const last = prefix.split(":").pop() ?? prefix;
  if (/border|ring|outline/.test(last)) return "border";
  if (/^(bg|fill)/.test(last)) return "fill";
  if (/^(text|placeholder)/.test(last)) return "text";
  return undefined;
}

export interface SkillContext {
  ds: DesignSystem;
  s: DesignSystemSettings;
  t: DesignSystemTokens;
  stack: StackId;
  tailwind: boolean;
  shadcn: boolean;
  /** Product name, or "this product". */
  product: string;
  slug: string;
  description: string;
  /** The name of the token that holds this color, e.g. "primary" or "brand-600". Null if none does. */
  colorName: (hex: string, use?: ColorUse, prefer?: string[]) => string | null;
  /** A color as a CSS reference, e.g. var(--ring) or var(--color-brand-600). */
  cssVar: (hex: string, use?: ColorUse, prefer?: string[]) => string;
  /** A color as a Tailwind class, e.g. bg-primary. The prefix tells how the color is used. */
  twColor: (prefix: string, hex: string, prefer?: string[]) => string;
  /** Replaces every hex or rgb color inside a CSS value with a variable reference. */
  varize: (css: string, use?: ColorUse) => string;
}

const upper = (hex: string) => hex.toUpperCase();

/** "rgb(130 141 255 / 0.5)" to the hex it is based on and the alpha. */
function parseRgb(value: string): { hex: string; alpha: number } | null {
  const m = value.match(/^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/);
  if (!m) return null;
  const hex = "#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase();
  return { hex, alpha: m[4] === undefined ? 1 : Number(m[4]) };
}

export function createContext(ds: DesignSystem, options: SkillOptions): SkillContext {
  const { settings: s, tokens: t } = ds;
  const stack = options.stack;
  const tailwind = stack !== "html-css";
  const { colors } = t;
  const primary = t.controls.buttons.variants.primary;
  const destructive = t.controls.buttons.variants.destructive;

  // Priority order matters: when two tokens share a color, the first name wins. Roles come first.
  const named: [string, string][] = [];
  const add = (name: string, hex: string) => named.push([name, upper(hex)]);
  add("primary-hover", primary.hover.background);
  add("primary-pressed", primary.pressed.background);
  add("destructive-hover", destructive.hover.background);
  add("destructive-pressed", destructive.pressed.background);
  add("placeholder", colors.placeholder);
  for (const [role, hex] of Object.entries(colors.roles)) add(role, hex);
  const addScale = (prefix: string, scale: ColorScale) => SCALE_STEPS.forEach((step) => add(`${prefix}-${step}`, scale[step]));
  addScale("brand", colors.brand);
  addScale("neutral", colors.neutral);
  if (colors.secondary) addScale("secondary", colors.secondary);
  (Object.keys(colors.semantic) as SemanticName[]).forEach((name) => addScale(name, colors.semantic[name]));

  const lookup = new Map<string, string>();
  for (const [name, hex] of named) if (!lookup.has(hex)) lookup.set(hex, name);

  const byName = new Map(named.map(([name, hex]) => [name, hex]));
  const colorName = (hex: string, use?: ColorUse, prefer?: string[]) => {
    const target = upper(hex);
    const wanted = prefer?.find((name) => byName.get(name) === target);
    if (wanted) return wanted;
    if (use) {
      const preferred = PREFERRED[use].find((name) => byName.get(name) === target);
      if (preferred) return preferred;
    }
    return lookup.get(target) ?? null;
  };

  const isRole = (name: string) => name in colors.roles || ["primary-hover", "primary-pressed", "destructive-hover", "destructive-pressed", "placeholder"].includes(name);
  const varFor = (name: string) => {
    // With shadcn, roles live on :root under their own name. In plain React + Tailwind every color is a
    // theme variable. In plain CSS every color is a plain variable.
    if (stack === "react-tailwind") return `--color-${name}`;
    if (isRole(name)) return `--${name}`;
    return tailwind ? `--color-${name}` : `--${name}`;
  };

  const cssVar = (hex: string, use?: ColorUse, prefer?: string[]) => {
    if (hex === "transparent") return "transparent";
    const name = colorName(hex, use, prefer);
    if (!name) throw new Error(`No token holds the color ${hex}`);
    return `var(${varFor(name)})`;
  };

  const twColor = (prefix: string, hex: string, prefer?: string[]) => {
    if (hex === "transparent") return `${prefix}-transparent`;
    const name = colorName(hex, colorUseForPrefix(prefix), prefer);
    if (!name) throw new Error(`No token holds the color ${hex}`);
    return `${prefix}-${name}`;
  };

  const varize = (css: string, use?: ColorUse) => {
    let out = css.replace(/rgb\([^)]*\)/g, (match) => {
      const parsed = parseRgb(match);
      if (!parsed) return match;
      const ref = cssVar(parsed.hex, use);
      return parsed.alpha === 1 ? ref : `color-mix(in srgb, ${ref} ${Math.round(parsed.alpha * 100)}%, transparent)`;
    });
    out = out.replace(/#[0-9A-Fa-f]{6}\b/g, (hex) => cssVar(hex, use));
    return out;
  };

  const product = options.name.trim() || "this product";
  return {
    ds,
    s,
    t,
    stack,
    tailwind,
    shadcn: stack === "next-tailwind-shadcn",
    product,
    slug: skillSlug(options.name),
    description: options.description.trim(),
    colorName,
    cssVar,
    twColor,
    varize,
  };
}

// ─────────────────────────────────────────────────────────────
// Small formatting helpers shared by the templates
// ─────────────────────────────────────────────────────────────

export const lines = (...parts: (string | string[] | null | undefined | false)[]): string[] =>
  parts.flatMap((part) => (part === null || part === undefined || part === false ? [] : Array.isArray(part) ? part : [part]));

export const fence = (language: string, body: string | string[]): string[] => ["```" + language, ...(Array.isArray(body) ? body : [body]), "```"];

export const table = (header: string[], rows: string[][]): string[] => [
  `| ${header.join(" | ")} |`,
  `| ${header.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.join(" | ")} |`),
];

export const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** The variable that holds a radius value, e.g. var(--radius-lg). */
export function radiusRef(ctx: SkillContext, px: number): string {
  const { radius } = ctx.t;
  const hit = (["sm", "md", "lg", "full"] as const).find((name) => radius[name] === px);
  return hit ? `var(--radius-${hit})` : `${px}px`;
}

/** The variable that holds a shadow, e.g. var(--shadow-md) in Tailwind or var(--shadow-3) in plain CSS. */
export function shadowRef(ctx: SkillContext, css: string): string | null {
  const hit = ctx.t.elevation.shadows.find((shadow) => shadow.level > 0 && shadow.css === css);
  if (!hit) return null;
  return ctx.tailwind ? `var(--shadow-${SHADOW_NAMES[hit.level - 1]})` : `var(--shadow-${hit.level})`;
}

/** A style recipe as CSS declaration lines, with colors, radii and shadows replaced by variables. */
export const recipeLines = (ctx: SkillContext, recipe: CssRecipe, indent = "  "): string[] =>
  Object.entries(recipe).map(([key, value]) => {
    if (key === "borderRadius" && typeof value === "number") return `${indent}border-radius: ${radiusRef(ctx, value)};`;
    if (key === "boxShadow" && typeof value === "string") {
      const ref = shadowRef(ctx, value);
      if (ref) return `${indent}box-shadow: ${ref};`;
    }
    const text = typeof value === "number" && value !== 0 && !/opacity|zIndex|fontWeight|lineHeight/.test(key) ? `${value}px` : String(value);
    const use: ColorUse | undefined = /border|outline/i.test(key) ? "border" : /^background/i.test(key) ? "fill" : /^color$/i.test(key) ? "text" : undefined;
    return `${indent}${kebab(key)}: ${ctx.varize(text, use)};`;
  });

/**
 * Puts each top-level CSS rule on one line when it fits, so the file stays short. Comments and
 * rules that are too long keep their original layout.
 */
export function compactCss(css: string, max = 190): string {
  const out: string[] = [];
  let depth = 0;
  let chunk = "";
  const flush = () => {
    const text = chunk.trim();
    chunk = "";
    if (!text) return;
    const oneLine = text.replace(/\s*\n\s*/g, " ");
    out.push(text.startsWith("/*") || oneLine.length > max ? text : oneLine);
  };
  for (const line of css.split("\n")) {
    if (depth === 0 && line.trim().startsWith("/*") && line.includes("*/")) {
      flush();
      out.push(line.trim());
      continue;
    }
    if (depth === 0 && line.trim() === "") {
      flush();
      continue;
    }
    chunk += line + "\n";
    for (const ch of line) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }
    if (depth === 0) flush();
  }
  flush();
  return out.join("\n");
}

/** Spacing in Tailwind units: 16px is 4, 6px is 1.5. Tailwind's default step is 4px. */
export const unit = (px: number): string => String(px / 4);

export const remOf = (px: number): string => `${Math.round((px / 16) * 10000) / 10000}rem`;

const WEIGHT_CLASS: Record<number, string> = { 100: "thin", 200: "extralight", 300: "light", 400: "normal", 500: "medium", 600: "semibold", 700: "bold", 800: "extrabold", 900: "black" };
export const weightClass = (weight: number) => `font-${WEIGHT_CLASS[weight] ?? "normal"}`;

export const MIN_TEXT_PX = MIN_FONT_SIZE;

/** The size name (xs, sm, base...) for a pixel size. */
export const sizeName = (ctx: SkillContext, px: number) => ctx.t.typography.sizes.find((size) => size.px === px)?.name ?? "base";

/** Shadow utility names for levels 1 to 5. */
export const SHADOW_NAMES = ["xs", "sm", "md", "lg", "xl"];

export const shadowClass = (level: number) => (level <= 0 ? "shadow-none" : `shadow-${SHADOW_NAMES[Math.min(level, 5) - 1]}`);

/** The first step of a semantic scale that reads as text at 4.5:1 on all the given surfaces. */
export function readableStep(scale: ColorScale, surfaces: string[], contrast: (a: string, b: string) => number): ScaleStep {
  const order: ScaleStep[] = [700, 800, 600];
  return order.find((step) => surfaces.every((surface) => contrast(scale[step], surface) >= 4.5)) ?? 900;
}

/** The spacing variable (plain CSS) closest to a px value, e.g. var(--space-3). Never a raw pixel value. */
export function spaceVar(ctx: SkillContext, px: number): string {
  const steps = ctx.t.spacing.scale;
  const best = steps.reduce((a, b) => (Math.abs(b.px - px) < Math.abs(a.px - px) ? b : a));
  return `var(--space-${best.key.replace(".", "_")})`;
}

export const DENSITIES: Density[] = ["compact", "comfortable", "spacious"];

export const spacingFor = (ctx: SkillContext, density: Density) => generateSpacing({ base: ctx.s.spacing.base, density }).semantic;

export interface PaintHints {
  bg?: string[];
  text?: string[];
  border?: string[];
}

export interface PaintHints {
  bg?: string[];
  text?: string[];
  border?: string[];
}

/** Tailwind classes for the colors of a control state. Only properties that differ from `base` are written. */
export function paintClasses(ctx: SkillContext, style: ControlStateStyle, prefix = "", base?: ControlStateStyle, hints: PaintHints = {}): string[] {
  const out: string[] = [];
  const add = (cls: string) => out.push(prefix ? `${prefix}:${cls}` : cls);
  if (!base || style.background !== base.background) add(ctx.twColor("bg", style.background, hints.bg));
  if (!base || style.color !== base.color) add(ctx.twColor("text", style.color, hints.text));
  if (!base || style.borderColor !== base.borderColor) {
    if (style.borderColor !== "transparent" || base) add(ctx.twColor("border", style.borderColor, hints.border));
  }
  return out;
}

export { nearestWeight };

/**
 * Plain CSS only: removes the spaces around braces, colons and semicolons so component CSS costs
 * fewer bytes. Values keep their inner spaces, so calc(), font shorthands and selectors stay valid.
 */
export function tightCss(css: string[]): string[] {
  return css.map((raw) => {
    const line = raw.trim();
    return line.startsWith("/*") ? line : line.replace(/:\s+/g, ":").replace(/,\s+/g, ",").replace(/;\s*}/g, "}").replace(/;\s+/g, ";").replace(/\s*{\s*/g, "{").replace(/\s*}\s*/g, "}").replace(/(?<![\w.-])0px\b(?![^()]*\))/g, "0").replace(/(?<![\w.#-])0\.(\d)/g, ".$1").replace(/=\"([\w-]+)\"\]/g, "=$1]");
  });
}

/** Same, but only for the plain CSS stack (the Tailwind stacks show class lists, not CSS). */
export function tight(ctx: SkillContext, css: string[]): string[] {
  return ctx.tailwind ? css : tightCss(css);
}

/** The first text step of a scale that reads at 4.5:1 on its own 50 tint, for badges. */
export function onTint(scale: ColorScale): 700 | 800 {
  return ([700, 800] as const).find((step) => contrastRatio(scale[step], scale[50]) >= 4.5) ?? 800;
}
