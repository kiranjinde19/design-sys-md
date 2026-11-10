/**
 * Safety net for settings.
 *
 * Anything that enters the system (a saved file in localStorage, a slider, a typed
 * hex code) passes through normalizeSettings. Out-of-range numbers are clamped,
 * unknown options fall back to the previous value, and the shape is always complete.
 */

import { normalizeHex } from "./color-math";
import { SIGNATURE_CATALOG } from "./signature";
import {
  COLOR_ROLE_NAMES,
  SCALE_STEPS,
  SETTINGS_SCHEMA_VERSION,
  type BorderSettings,
  type ColorRef,
  type ColorRoleName,
  type ColorSettings,
  type ControlSettings,
  type DesignSystemSettings,
  type ElevationSettings,
  type IconSettings,
  type RadiusSettings,
  type ScaleName,
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

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" && value.length <= 60 ? value.trim() : fallback;
}

const SCALE_NAMES: readonly ScaleName[] = ["brand", "neutral", "success", "warning", "error", "info"];

function normalizeColorRef(value: unknown, fallback: ColorRef): ColorRef {
  const v = asRecord(value);
  if (v.scale === "white" || v.scale === "black") return { scale: v.scale };
  if (typeof v.scale === "string" && (SCALE_NAMES as readonly string[]).includes(v.scale)) {
    const step = oneOf(v.step, SCALE_STEPS, 600);
    return { scale: v.scale as ScaleName, step };
  }
  return fallback;
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
  const rolesIn = asRecord(colors.roles);

  const roles = {} as Record<ColorRoleName, ColorRef>;
  for (const name of COLOR_ROLE_NAMES) {
    roles[name] = normalizeColorRef(rolesIn[name], base.colors.roles[name]);
  }

  const signatureOut = {} as Record<keyof SignatureSettings, string>;
  for (const key of Object.keys(SIGNATURE_CATALOG) as (keyof SignatureSettings)[]) {
    const ids = SIGNATURE_CATALOG[key].options.map((option) => option.id as string);
    signatureOut[key] = oneOf(signature[key], ids, base.signature[key]);
  }

  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    colors: {
      brand: normalizeHex(colors.brand) ?? base.colors.brand,
      // null means "no secondary color". A missing value keeps whatever was there before.
      secondary: colors.secondary === null ? null : (normalizeHex(colors.secondary) ?? base.colors.secondary),
      neutralTone: oneOf(colors.neutralTone, ["cool", "warm", "pure", "brand"] as const, base.colors.neutralTone),
      roles,
    },
    typography: {
      headingFont: text(typography.headingFont, base.typography.headingFont),
      bodyFont: text(typography.bodyFont, base.typography.bodyFont),
      baseSize: num(typography.baseSize, 12, 24, base.typography.baseSize, 1),
      scaleRatio: num(typography.scaleRatio, 1.125, 1.5, base.typography.scaleRatio, 0.005),
      lineHeight: num(typography.lineHeight, 1.2, 2, base.typography.lineHeight, 0.05),
      headingWeight: oneOf(typography.headingWeight, [400, 500, 600, 700] as const, base.typography.headingWeight),
      bodyWeight: oneOf(typography.bodyWeight, [400, 500, 600, 700] as const, base.typography.bodyWeight),
    },
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
