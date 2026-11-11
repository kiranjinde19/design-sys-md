/**
 * Safety net for settings.
 *
 * Anything that enters the system (a saved file in localStorage, a slider, a typed
 * hex code) passes through normalizeSettings. Out-of-range numbers are clamped,
 * unknown options fall back to the previous value, and the shape is always complete.
 */

import { normalizeHex } from "./color-math";
import { getFont, nearestWeight, offeredWeights, sanitizeFontName } from "./fonts";
import { SIGNATURE_CATALOG } from "./signature";
import {
  COLOR_ROLE_NAMES,
  OVERRIDABLE_ROLES,
  type OverridableRole,
  type ScaleStep,
  SCALE_STEPS,
  SETTINGS_SCHEMA_VERSION,
  type BorderSettings,
  type ColorRef,
  type ColorRoleName,
  type ColorSettings,
  type ControlSettings,
  type DesignSystemSettings,
  type FontChoice,
  type FontWeight,
  type ElevationSettings,
  type IconSettings,
  type RadiusSettings,
  type ScaleName,
  type ProjectSettings,
  type VoiceSettings,
  STACK_IDS,
  type SignatureSettings,
  type SpacingSettings,
  type TypographySettings,
} from "./types";
import { clamp, round } from "./units";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {});

function oneOf<T extends string | number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly unknown[]).includes(value) ? (value as T) : fallback;
}

function num(value: unknown, min: number, max: number, fallback: number, step?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const stepped = step ? Math.round(value / step) * step : value;
  return round(clamp(stepped, min, max), 4);
}

/**
 * Accepts the current shape ({ kind, name }) and the old one (a plain font name string),
 * so work saved before fonts became objects still loads.
 */
function parseFontChoice(value: unknown): FontChoice | null {
  if (typeof value === "string") {
    return getFont(value) ? { kind: "catalog", name: value } : null;
  }
  const v = asRecord(value);
  if (v.kind === "catalog" && typeof v.name === "string" && getFont(v.name)) {
    return { kind: "catalog", name: v.name };
  }
  if (v.kind === "brand") {
    const name = sanitizeFontName(v.name);
    const fallbackName = typeof v.fallback === "string" && getFont(v.fallback) ? v.fallback : "Inter";
    if (name) return { kind: "brand", name, fallback: fallbackName };
  }
  return null;
}

const normalizeFontChoice = (value: unknown, fallback: FontChoice): FontChoice =>
  parseFontChoice(value) ?? fallback;

/** A weight the font really offers: the wanted one if it exists, else the nearest. */
function weightFor(value: unknown, choice: FontChoice, fallback: FontWeight): FontWeight {
  const wanted = oneOf(value, [100, 200, 300, 400, 500, 600, 700, 800, 900] as const, fallback);
  return nearestWeight(wanted, offeredWeights(choice));
}

/** Free text that ends up in a file header: one line, no angle brackets, no control characters. */
function oneLine(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

const SCALE_NAMES: readonly ScaleName[] = ["brand", "neutral", "secondary", "success", "warning", "error", "info"];

/** A compact text form, used in the data block: "white", "black", "brand-700". */
export function colorRefFromText(text: unknown): ColorRef | null {
  if (typeof text !== "string") return null;
  if (text === "white" || text === "black") return { scale: text };
  const match = /^([a-z]+)-(\d+)$/.exec(text);
  if (!match || !(SCALE_NAMES as readonly string[]).includes(match[1])) return null;
  const step = Number(match[2]);
  return (SCALE_STEPS as readonly number[]).includes(step) ? { scale: match[1] as ScaleName, step: step as ScaleStep } : null;
}
export const colorRefToText = (ref: ColorRef): string => ("step" in ref ? `${ref.scale}-${ref.step}` : ref.scale);

function normalizeColorRef(value: unknown, fallback: ColorRef): ColorRef {
  const fromText = colorRefFromText(value);
  if (fromText) return fromText;
  const v = asRecord(value);
  if (v.scale === "white" || v.scale === "black") return { scale: v.scale };
  if (typeof v.scale === "string" && (SCALE_NAMES as readonly string[]).includes(v.scale)) {
    const step = oneOf(v.step, SCALE_STEPS, 600);
    return { scale: v.scale as ScaleName, step };
  }
  return fallback;
}

/**
 * Choices that were removed because they used a glow effect, and what replaces them. Saved work and
 * imported files that still say the old id silently get the new one.
 */
const LEGACY_SIGNATURE: Partial<Record<keyof SignatureSettings, Record<string, { to: string; notice: string }>>> = {
  primaryCta: { "animated-glow-border": { to: "border-beam", notice: "Replaced the old glow with the border beam." } },
  featuredHighlight: { "glow-border": { to: "crisp-border", notice: "Replaced the old glow border with the crisp border." } },
  focusRing: { "glow-ring": { to: "soft-ring", notice: "Renamed the old glow ring to the soft ring." } },
};

const modernId = (key: keyof SignatureSettings, id: unknown) => (typeof id === "string" ? LEGACY_SIGNATURE[key]?.[id]?.to ?? id : id);

/** What a file or saved state would have changed: the messages for every old glow id it still holds. */
export function legacyChoiceNotices(input: unknown, base: DesignSystemSettings): string[] {
  const signature = asRecord(asRecord(input).signature);
  const notices: string[] = [];
  for (const key of Object.keys(LEGACY_SIGNATURE) as (keyof SignatureSettings)[]) {
    const id = key in signature ? signature[key] : base.signature[key];
    const hit = typeof id === "string" ? LEGACY_SIGNATURE[key]?.[id] : undefined;
    if (hit) notices.push(hit.notice);
  }
  return notices;
}

export function normalizeSettings(input: unknown, base: DesignSystemSettings): DesignSystemSettings {
  const root = asRecord(input);
  const colors = asRecord(root.colors);
  const typography = asRecord(root.typography);
  const icons = asRecord(root.icons);
  const radius = asRecord(root.radius);
  const spacing = asRecord(root.spacing);
  const borders = asRecord(root.borders);
  const elevation = asRecord(root.elevation);
  const controls = asRecord(root.controls);
  const signature = asRecord(root.signature);
  const voice = asRecord(root.voice);
  const project = asRecord(root.project);
  const rolesIn = asRecord(colors.roles);

  const roles = {} as Record<ColorRoleName, ColorRef>;
  for (const name of COLOR_ROLE_NAMES) {
    roles[name] = normalizeColorRef(rolesIn[name], base.colors.roles[name]);
  }

  // Roles the user assigned by hand. Absent means nothing was changed (the key is left out, so presets stay as they are).
  const overridesIn = colors.roleOverrides === undefined ? base.colors.roleOverrides : asRecord(colors.roleOverrides);
  const roleOverrides: Partial<Record<OverridableRole, ColorRef>> = {};
  for (const key of OVERRIDABLE_ROLES) {
    const raw = (overridesIn as UnknownRecord | undefined)?.[key];
    if (raw === undefined || raw === null) continue;
    const ref = normalizeColorRef(raw, { scale: "white" });
    // normalizeColorRef falls back to white for junk; only keep references that were really valid.
    if (colorRefFromText(raw)) roleOverrides[key] = ref;
    else if (isRecord(raw) && (raw.scale === "white" || raw.scale === "black" || (typeof raw.scale === "string" && (SCALE_NAMES as readonly string[]).includes(raw.scale)))) roleOverrides[key] = ref;
  }

  const signatureOut = {} as Record<keyof SignatureSettings, string>;
  for (const key of Object.keys(SIGNATURE_CATALOG) as (keyof SignatureSettings)[]) {
    const ids = SIGNATURE_CATALOG[key].options.map((option) => option.id as string);
    signatureOut[key] = oneOf(modernId(key, signature[key]), ids, modernId(key, base.signature[key]) as string);
  }

  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    colors: {
      brand: normalizeHex(colors.brand) ?? base.colors.brand,
      brandMode: oneOf(colors.brandMode, ["exact", "adjusted"], base.colors.brandMode ?? "exact") as "exact" | "adjusted",
      // null means "no secondary color". A missing value keeps whatever was there before.
      secondary: colors.secondary === null ? null : (normalizeHex(colors.secondary) ?? base.colors.secondary),
      neutralTone: oneOf(colors.neutralTone, ["cool", "warm", "pure", "brand"] as const, base.colors.neutralTone),
      roles,
      ...(Object.keys(roleOverrides).length ? { roleOverrides } : {}),
    },
    typography: (() => {
      const headingFont = normalizeFontChoice(typography.headingFont, base.typography.headingFont);
      const bodyFont = normalizeFontChoice(typography.bodyFont, base.typography.bodyFont);
      return {
        headingFont,
        bodyFont,
        // null is a real answer (no mono font). Only a missing value keeps the previous one.
        monoFont: typography.monoFont === null ? null : (parseFontChoice(typography.monoFont) ?? base.typography.monoFont),
        headingTracking: num(typography.headingTracking, -0.04, 0.02, base.typography.headingTracking, 0.005),
        baseSize: num(typography.baseSize, 12, 24, base.typography.baseSize, 1),
        scaleRatio: num(typography.scaleRatio, 1.125, 1.5, base.typography.scaleRatio, 0.005),
        lineHeight: num(typography.lineHeight, 1.2, 2, base.typography.lineHeight, 0.05),
        headingWeight: weightFor(typography.headingWeight, headingFont, base.typography.headingWeight),
        bodyWeight: weightFor(typography.bodyWeight, bodyFont, base.typography.bodyWeight),
      };
    })(),
    icons: {
      style: oneOf(icons.style, ["outline", "solid", "duotone"] as const, base.icons.style),
      strokeWidth: num(icons.strokeWidth, 1, 3, base.icons.strokeWidth, 0.25),
      ends: oneOf(icons.ends, ["round", "sharp"] as const, base.icons.ends),
    },
    radius: { base: num(radius.base, 0, 24, base.radius.base, 1) },
    spacing: {
      base: oneOf(spacing.base, [4, 8] as const, base.spacing.base),
      density: oneOf(spacing.density, ["compact", "comfortable", "spacious"] as const, base.spacing.density),
    },
    borders: {
      width: oneOf(borders.width, [1, 2] as const, base.borders.width),
      colorStep: oneOf(borders.colorStep, SCALE_STEPS, base.borders.colorStep),
    },
    elevation: {
      levels: num(elevation.levels, 0, 5, base.elevation.levels, 1),
      intensity: num(elevation.intensity, 0, 100, base.elevation.intensity, 1),
      style: oneOf(elevation.style, ["soft", "hard", "brand-tinted"] as const, base.elevation.style),
    },
    controls: {
      secondaryStyle: oneOf(controls.secondaryStyle, ["fill", "outline"] as const, base.controls.secondaryStyle),
      height: num(controls.height, 32, 56, base.controls.height, 4),
    },
    signature: signatureOut as unknown as SignatureSettings,
    voice: {
      formality: num(voice.formality, 1, 5, base.voice.formality, 1),
      energy: num(voice.energy, 1, 5, base.voice.energy, 1),
      detail: num(voice.detail, 1, 5, base.voice.detail, 1),
    },
    project: {
      name: oneLine(project.name, base.project.name, 60),
      description: oneLine(project.description, base.project.description, 200),
      stack: oneOf(project.stack, STACK_IDS, base.project.stack),
    },
  };
}

/** A patch can change any nested setting without repeating the rest. */
export interface SettingsPatch {
  colors?: Partial<Omit<ColorSettings, "roles">> & { roles?: Partial<ColorSettings["roles"]> };
  typography?: Partial<TypographySettings>;
  icons?: Partial<IconSettings>;
  radius?: Partial<RadiusSettings>;
  spacing?: Partial<SpacingSettings>;
  borders?: Partial<BorderSettings>;
  elevation?: Partial<ElevationSettings>;
  controls?: Partial<ControlSettings>;
  signature?: Partial<SignatureSettings>;
  voice?: Partial<VoiceSettings>;
  project?: Partial<ProjectSettings>;
}

/** Applies a patch on top of existing settings, then validates the result. */
export function applyPatch(current: DesignSystemSettings, patch: SettingsPatch): DesignSystemSettings {
  const merged = JSON.parse(JSON.stringify(current)) as UnknownRecord;
  for (const [section, value] of Object.entries(patch as UnknownRecord)) {
    const target = asRecord(merged[section]);
    if (!isRecord(value)) continue;
    for (const [key, inner] of Object.entries(value)) {
      // Color roles are replaced one role at a time, and each role is replaced whole.
      if (section === "colors" && key === "roles" && isRecord(inner)) {
        target.roles = { ...asRecord(target.roles), ...inner };
      } else {
        target[key] = inner;
      }
    }
    merged[section] = target;
  }
  return normalizeSettings(merged, current);
}
