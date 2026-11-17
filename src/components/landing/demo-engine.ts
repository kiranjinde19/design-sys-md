/**
 * What the landing page demo shows, computed by the app's real code: the token engine (createDesignSystem), the contrast
 * math (inside the engine, WCAG_AA) and the SKILL.md generator (generateSkillFile). Nothing here copies their logic.
 *
 * The server page calls this for the first paint. The browser loads this file lazily (a dynamic import) after the page is
 * up, so the engine does not weigh on the first load.
 */

import { WCAG_AA } from "@/lib/design-system/contrast";
import { createDesignSystem } from "@/lib/design-system/generate";
import { applyPatch } from "@/lib/design-system/normalize";
import { catalogFont, defaultTracking } from "@/lib/design-system/fonts";
import { PRESETS } from "@/lib/design-system/presets";
import { generateSkillFile } from "@/lib/design-system/skill/generate";
import { STACK_IDS } from "@/lib/design-system/types";
import { DEMO_DEFAULT, DEMO_FONTS, type DemoInput } from "./demo-constants";

export interface DemoView {
  brand: string;
  /** The 10 brand scale steps, 50 to 900, and the 10 neutral steps. */
  scale: string[];
  neutral: string[];
  /** Button text color, its contrast on the brand color, and whether it passes AA. */
  onBrand: { hex: string; white: boolean; ratio: number; passes: boolean };
  heading: string;
  body: string;
  /** Radius in px: control (buttons, fields), card, and small (marks and tags). */
  radius: { control: number; card: number; small: number };
  /** The lines of the SKILL.md excerpt, each a label and a value. A line with no label is plain text. */
  excerpt: { key: string; value: string; swatch?: string; heading?: boolean }[];
  /** The size of the whole generated AGENTS.md in KiB (Next.js stack), and its share of Codex's 32 KiB. */
  fileKiB: number;
  fileShare: number;
}

export interface DemoFacts {
  scaleSteps: number;
  aa: number;
  grid: number;
  stacks: number;
}

function firstSentence(text: string): string {
  const cut = text.indexOf(". ");
  return (cut === -1 ? text : text.slice(0, cut + 1)).trim();
}

/** Settings for one demo state, built on SaaS Clean with the visitor's brand color, corners and type. */
function demoSettings({ brand, radius, font }: DemoInput) {
  const pick = DEMO_FONTS[font] ?? DEMO_FONTS[0];
  return applyPatch(PRESETS["saas-clean"].settings, {
    colors: { brand },
    radius: { base: radius },
    typography: { headingFont: catalogFont(pick.heading), bodyFont: catalogFont(pick.body), headingTracking: defaultTracking(catalogFont(pick.heading)) },
    project: { name: "Acme Billing", description: "Billing software for small teams.", stack: "next-tailwind-shadcn" },
  });
}

export function computeDemo(input: DemoInput): DemoView {
  const system = createDesignSystem(demoSettings(input));
  const { tokens } = system;
  const file = generateSkillFile(system, { presetId: "saas-clean" });
  const { brandReport, brand: scale } = tokens.colors;
  const text = brandReport.primaryText;

  // Two rules, read from the real file's Hard rules (first sentence of rule 3 and of rule 4).
  const rule = (n: number) => firstSentence((file.skill.split("\n").find((line) => line.startsWith(`${n}. `)) ?? "").replace(/^\d+\.\s*/, ""));
  const description = /^description:\s*"?(.*?)"?$/m.exec(file.skill)?.[1] ?? "";
  const short = description.length > 34 ? `${description.slice(0, 34).trimEnd()}…` : description;

  const ratio = Math.round(text.ratio * 10) / 10;
  const passes = text.ratio >= WCAG_AA;
  return {
    brand: brandReport.effective,
    scale: Object.values(scale),
    neutral: Object.values(tokens.colors.neutral),
    onBrand: { hex: text.hex, white: text.isWhite, ratio, passes },
    heading: tokens.typography.heading.name,
    body: tokens.typography.body.name,
    radius: { control: tokens.radius.md, card: tokens.radius.lg, small: tokens.radius.sm },
    excerpt: [
      { key: "---", value: "" },
      { key: "name: ", value: file.slug },
      { key: "description: ", value: `"${short}"` },
      { key: "---", value: "" },
      { key: "", value: "" },
      { key: "## Color", value: "", heading: true },
      { key: "brand      ", value: brandReport.effective, swatch: brandReport.effective },
      { key: "on-brand   ", value: `${text.hex.toUpperCase()}  ${ratio.toFixed(1)}:1 ${passes ? "AA" : "fail"}` },
      { key: "", value: "" },
      { key: "## Type", value: "", heading: true },
      { key: "heading    ", value: tokens.typography.heading.name },
      { key: "body       ", value: tokens.typography.body.name },
      { key: "", value: "" },
      { key: "## Radius", value: "", heading: true },
      { key: "control    ", value: `${tokens.radius.md}px` },
      { key: "card       ", value: `${tokens.radius.lg}px` },
      { key: "", value: "" },
      { key: "## Rules", value: "", heading: true },
      { key: "- ", value: rule(3) },
      { key: "- ", value: rule(4) },
    ],
    fileKiB: file.agentsBytes / 1024,
    fileShare: file.agentsBytes / (32 * 1024),
  };
}

/** The numbers in the facts row, read from the engine and the generator. */
export function computeFacts(): DemoFacts {
  const { tokens } = createDesignSystem(demoSettings(DEMO_DEFAULT));
  return { scaleSteps: Object.keys(tokens.colors.brand).length, aa: WCAG_AA, grid: tokens.spacing.base, stacks: STACK_IDS.length };
}

/** One real excerpt per "What is inside" card: a few lines read from the generated AGENTS.md (Next.js stack), never typed by hand. */
export interface InsideExcerpt {
  /** The section of the file the lines come from. */
  from: string;
  lines: string[];
}

export function computeInsideExcerpts(): Record<string, InsideExcerpt> {
  const file = generateSkillFile(createDesignSystem(demoSettings(DEMO_DEFAULT)), { presetId: "saas-clean" }).agents.split("\n");
  const section = (heading: string) => {
    const start = file.findIndex((line) => line === heading);
    if (start === -1) return [];
    // The section runs to the next heading of the same or a higher level (## Tokens holds its ### parts).
    const level = heading.match(/^#+/)![0].length;
    const end = file.findIndex((line, i) => i > start && new RegExp(`^#{1,${level}} `).test(line));
    return file.slice(start + 1, end === -1 ? undefined : end).filter((line) => line.trim() !== "");
  };
  const starting = (lines: string[], prefixes: string[]) => prefixes.map((prefix) => lines.find((line) => line.startsWith(prefix))).filter((line): line is string => Boolean(line));
  const clip = (line: string) => line.replace(/\s+/g, " ").trim();

  const tokens = section("## Tokens");
  // The brand scale is written across a few lines of the @theme block: join them, then pick steps 50, 100, 500 and 900.
  const brandVars = tokens.filter((line) => line.startsWith("--color-brand-")).join(";").split(";").filter((v) => v.startsWith("--color-brand-"));
  const tokenLines = [0, 1, 5, 9].map((i) => brandVars[i]).filter(Boolean);

  const tone = section("## Tone of voice");
  const access = section("## Accessibility");
  const check = section("## Final checklist");
  return {
    Tokens: { from: "## Tokens", lines: tokenLines.map(clip) },
    "Component recipes": { from: "### Buttons", lines: section("### Buttons").filter((line) => /^\s*(primary|secondary|tertiary): "/.test(line)).map(clip) },
    "Signature details": { from: "## Signature details", lines: starting(section("## Signature details"), ["/* Hover", ".card-hover:hover", "/* Featured", ".card-featured{"]).map(clip) },
    "Tone of voice": { from: "## Tone of voice", lines: tone.filter((line) => /^[123]\. /.test(line)).map(clip) },
    Accessibility: { from: "## Accessibility", lines: starting(access, ["| primary-foreground", "| muted-foreground", "| destructive-foreground"]).map((line) => clip(line.replace(/^\||\|$/g, "").replace(/\|/g, " "))) },
    "Final checklist": { from: "## Final checklist", lines: check.filter((line) => line.startsWith("- [ ]")).slice(0, 3).map(clip) },
  };
}
