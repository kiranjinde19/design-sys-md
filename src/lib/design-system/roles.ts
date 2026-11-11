/**
 * Role assignments: which swatch plays which role, the safety check that runs before any assignment is applied,
 * and the words the Colors editor shows for it. Pure functions: the editor and the tests share this one source.
 *
 * Rules (the engine's own): Text and Muted text reach 4.5:1 on the Background and the Surface; Primary allows white or
 * dark button text at 4.5:1; Input border and Focus ring reach 3:1 on the Background, the Surface and the muted fill;
 * Border has no requirement. On top of that, no contrast pair that passed before may fail afterwards.
 */

import { WHITE, BLACK } from "./colors";
import { contrastRatio } from "./contrast";
import { generateTokens } from "./generate";
import { applyPatch } from "./normalize";
import {
  OVERRIDABLE_ROLES,
  SCALE_STEPS,
  type ColorRef,
  type DesignSystemSettings,
  type DesignSystemTokens,
  type OverridableRole,
  type ScaleName,
  type ScaleStep,
} from "./types";

export const ROLE_ROWS: { key: OverridableRole; label: string; help: string }[] = [
  { key: "primary", label: "Primary", help: "Main buttons and key actions" },
  { key: "background", label: "Background", help: "The page" },
  { key: "card", label: "Surface (cards)", help: "Cards and panels" },
  { key: "foreground", label: "Text", help: "Body text and headings" },
  { key: "muted-foreground", label: "Muted text", help: "Helper text and captions" },
  { key: "border", label: "Border", help: "Dividers and card edges" },
  { key: "input", label: "Input border", help: "Fields and controls" },
  { key: "ring", label: "Focus ring", help: "Keyboard focus" },
];

const SCALE_LABEL: Record<ScaleName, string> = { brand: "brand", neutral: "neutral", secondary: "secondary", success: "success", warning: "warning", error: "error", info: "info" };

/** "brand 700", "neutral 200", "white". */
export const refLabel = (ref: ColorRef): string => ("step" in ref ? `${SCALE_LABEL[ref.scale]} ${ref.step}` : ref.scale);
export const sentenceCase = (text: string) => text[0].toUpperCase() + text.slice(1);

export interface SwatchSource {
  id: string;
  ref: ColorRef;
  hex: string;
  label: string;
}
export interface SwatchGroup {
  id: "brand" | "neutral" | "secondary" | "status" | "fixed";
  title: string;
  items: SwatchSource[];
}

/** Every swatch a role can take: the brand, neutral and secondary scales, the status colors, white and black. */
export function swatchGroups(tokens: DesignSystemTokens): SwatchGroup[] {
  const { brand, neutral, secondary, semantic } = tokens.colors;
  const scale = (name: ScaleName, values: Record<ScaleStep, string>): SwatchSource[] =>
    SCALE_STEPS.map((step) => ({ id: `${name}-${step}`, ref: { scale: name, step }, hex: values[step], label: `${name} ${step}` }));
  const groups: SwatchGroup[] = [
    { id: "brand", title: "Brand scale", items: scale("brand", brand) },
    { id: "neutral", title: "Neutral scale", items: scale("neutral", neutral) },
  ];
  if (secondary) groups.push({ id: "secondary", title: "Secondary scale", items: scale("secondary", secondary) });
  groups.push({
    id: "status",
    title: "Status colors",
    items: (["success", "warning", "error", "info"] as const).map((name) => ({ id: `${name}-600`, ref: { scale: name, step: 600 as ScaleStep }, hex: semantic[name][600], label: `${name} 600` })),
  });
  groups.push({
    id: "fixed",
    title: "White and black",
    items: [
      { id: "white", ref: { scale: "white" }, hex: WHITE, label: "white" },
      { id: "black", ref: { scale: "black" }, hex: BLACK, label: "black" },
    ],
  });
  return groups;
}

/** Every swatch in one flat list, in picker order. */
export const allSwatches = (tokens: DesignSystemTokens): SwatchSource[] => swatchGroups(tokens).flatMap((group) => group.items);

/** What a role is currently set to, in words: "brand 600, #4F46E5". */
export function describeRole(tokens: DesignSystemTokens, key: OverridableRole): string {
  const hex = tokens.colors.roles[key === "card" ? "card" : key];
  const match = allSwatches(tokens).find((swatch) => swatch.hex.toUpperCase() === hex.toUpperCase());
  return `${match ? `${match.label}, ` : ""}${hex.toUpperCase()}`;
}

// ---------------------------------------------------------------------------------------------- the rules

interface Failure {
  /** Who is measured, for example "Text" or "Input border". */
  name: string;
  /** What it sits on, for example "white", "the background" or "the surface". */
  on: string;
  ratio: number;
  needed: 4.5 | 3;
  /** The roles involved, so a message can be about the role the user just changed. */
  roles: OverridableRole[];
  /** Set for failures found by the generic guard (a pair that passed before and fails now). */
  generic?: string;
}

const floor2 = (n: number) => Math.floor(n * 100) / 100;

function failures(tokens: DesignSystemTokens, baselineFailing: Set<string>): Failure[] {
  const r = tokens.colors.roles;
  const out: Failure[] = [];
  const surfaces: { name: string; hex: string; role: OverridableRole | null }[] = [
    { name: r.background.toUpperCase() === WHITE ? "white" : "the background", hex: r.background, role: "background" },
    { name: "the surface", hex: r.card, role: "card" },
  ];
  const check = (name: string, fg: string, role: OverridableRole, needed: 4.5 | 3, on: typeof surfaces) => {
    for (const surface of on) {
      const ratio = contrastRatio(fg, surface.hex);
      if (ratio < needed) out.push({ name, on: surface.name, ratio: floor2(ratio), needed, roles: surface.role ? [role, surface.role] : [role] });
    }
  };
  check("Text", r.foreground, "foreground", 4.5, surfaces);
  check("Muted text", r["muted-foreground"], "muted-foreground", 4.5, surfaces);
  const withMuted = [...surfaces, { name: "the muted fill", hex: r.muted, role: null }];
  check("Input border", r.input, "input", 3, withMuted);
  check("Focus ring", r.ring, "ring", 3, withMuted);
  const buttonText = r["primary-foreground"];
  const buttonRatio = contrastRatio(buttonText, r.primary);
  if (buttonRatio < 4.5) out.push({ name: "Button text", on: "the primary color", ratio: floor2(buttonRatio), needed: 4.5, roles: ["primary"] });
  // The engine's own list: nothing that passed before may fail now.
  for (const pair of tokens.colors.contrastPairs) {
    if (!pair.passes && !baselineFailing.has(pair.id)) {
      out.push({ name: pair.label, on: "its surface", ratio: pair.levels.ratio, needed: pair.required, roles: [], generic: pair.id });
    }
  }
  return out;
}

const failingIds = (tokens: DesignSystemTokens) => new Set(tokens.colors.contrastPairs.filter((pair) => !pair.passes).map((pair) => pair.id));

export type RoleCheck = { ok: true } | { ok: false; message: string; suggestion: ColorRef | null };

function candidate(settings: DesignSystemSettings, key: OverridableRole, ref: ColorRef): DesignSystemSettings {
  return applyPatch(settings, { colors: { roleOverrides: { ...settings.colors.roleOverrides, [key]: ref } } });
}

/** True when the assignment breaks none of the rules. */
function passes(settings: DesignSystemSettings, key: OverridableRole, ref: ColorRef, baseline: Set<string>): { ok: boolean; found: Failure[] } {
  const found = failures(generateTokens(candidate(settings, key, ref)), baseline);
  return { ok: found.length === 0, found };
}

/** The nearest passing swatch of the same scale (or, for white and black or a scale with no passing step, the neutral scale). */
function nearestPassing(settings: DesignSystemSettings, key: OverridableRole, ref: ColorRef, baseline: Set<string>): ColorRef | null {
  const scales: ScaleName[] = "step" in ref ? [ref.scale, "neutral"] : ["neutral"];
  const from = "step" in ref ? ref.step : ref.scale === "white" ? 50 : 900;
  for (const scale of scales) {
    if (scale === "secondary" && !settings.colors.secondary) continue;
    const steps = [...SCALE_STEPS].sort((a, b) => Math.abs(a - from) - Math.abs(b - from) || a - b);
    for (const step of steps) {
      const option: ColorRef = { scale, step };
      if (scale === ("step" in ref ? ref.scale : "") && step === from) continue;
      if (passes(settings, key, option, baseline).ok) return option;
    }
  }
  return null;
}

/**
 * Checks one assignment before it is applied. When it would break a rule it says which, with the measured ratio and
 * the closest passing swatch, and nothing is changed.
 */
export function checkAssignment(settings: DesignSystemSettings, key: OverridableRole, ref: ColorRef): RoleCheck {
  if (ref.scale === "secondary" && !settings.colors.secondary) return { ok: false, message: "There is no secondary color to use. Add one first.", suggestion: null };
  const baseline = failingIds(generateTokens(settings));
  const { ok, found } = passes(settings, key, ref, baseline);
  if (ok) return { ok: true };

  const label = sentenceCase(refLabel(ref));
  const own = found.find((f) => f.roles.includes(key)) ?? found[0];
  const need = own.needed === 4.5 ? "below AA (4.5:1)" : "below the 3:1 minimum";
  let sentence: string;
  if (key === "background" || key === "card") sentence = `${own.name} on ${label} is ${own.ratio}:1, ${need}.`;
  else if (key === "primary") sentence = `Button text on ${label} is ${own.ratio}:1, ${need}.`;
  else if (own.generic) sentence = `${label} would break "${own.name}" (${own.ratio}:1, ${need}).`;
  else sentence = `${label} on ${own.on} is ${own.ratio}:1, ${need}.`;

  const suggestion = nearestPassing(settings, key, ref, baseline);
  const tail = suggestion ? ` Closest passing step: ${refLabel(suggestion)}.` : " No swatch passes here.";
  return { ok: false, message: sentence + tail, suggestion };
}

/** Applies an assignment, or says why not. Nothing changes when it is rejected. */
export function assignRole(settings: DesignSystemSettings, key: OverridableRole, ref: ColorRef): { ok: true; settings: DesignSystemSettings } | { ok: false; message: string; suggestion: ColorRef | null } {
  const check = checkAssignment(settings, key, ref);
  if (!check.ok) return check;
  return { ok: true, settings: candidate(settings, key, ref) };
}

/** Removes one override (or all of them). */
export function resetRoles(settings: DesignSystemSettings, key?: OverridableRole): DesignSystemSettings {
  const next = { ...settings.colors.roleOverrides };
  if (key) delete next[key];
  return applyPatch(settings, { colors: { roleOverrides: key ? next : {} } });
}

export const hasOverride = (settings: DesignSystemSettings, key: OverridableRole) => Boolean(settings.colors.roleOverrides?.[key]);
export const overrideCount = (settings: DesignSystemSettings) => OVERRIDABLE_ROLES.filter((key) => hasOverride(settings, key)).length;

// ---------------------------------------------------------------------------------------------- the live pill

export interface RolePill {
  /** Words only, so nothing relies on color: "17.96:1 passes". */
  text: string;
  /** null means the role has no requirement. */
  passes: boolean | null;
}

/** The live contrast for one role, measured on the current tokens. */
export function rolePill(tokens: DesignSystemTokens, key: OverridableRole): RolePill {
  const r = tokens.colors.roles;
  const lowest = (fg: string, on: string[]) => Math.min(...on.map((bg) => contrastRatio(fg, bg)));
  const verdict = (ratio: number, needed: number): RolePill => ({ text: `${floor2(ratio).toFixed(2)}:1 ${ratio >= needed ? "passes" : "fails"}`, passes: ratio >= needed });
  switch (key) {
    case "primary":
      return verdict(contrastRatio(r["primary-foreground"], r.primary), 4.5);
    case "background":
      return verdict(contrastRatio(r.foreground, r.background), 4.5);
    case "card":
      return verdict(contrastRatio(r["card-foreground"], r.card), 4.5);
    case "foreground":
      return verdict(lowest(r.foreground, [r.background, r.card]), 4.5);
    case "muted-foreground":
      return verdict(lowest(r["muted-foreground"], [r.background, r.card]), 4.5);
    case "border":
      return { text: "No requirement", passes: null };
    case "input":
      return verdict(lowest(r.input, [r.background, r.card, r.muted]), 3);
    case "ring":
      return verdict(lowest(r.ring, [r.background, r.card, r.muted]), 3);
  }
}

/** What each pill measures, for a title and the screen reader ("white text on the primary color"). */
export const PILL_MEANING: Record<OverridableRole, string> = {
  primary: "Button text on the primary color, needs 4.5:1",
  background: "Text on the background, needs 4.5:1",
  card: "Text on the surface, needs 4.5:1",
  foreground: "Text on the background and the surface, needs 4.5:1",
  "muted-foreground": "Muted text on the background and the surface, needs 4.5:1",
  border: "Decorative, no contrast requirement",
  input: "Input border on the background, surface and muted fill, needs 3:1",
  ring: "Focus ring on the background, surface and muted fill, needs 3:1",
};
