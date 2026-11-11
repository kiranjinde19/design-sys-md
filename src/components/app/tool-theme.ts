/**
 * The tool's own colors. They are monochrome (black, white and pure gray) and FIXED: they never read the user's
 * design system, so editing a brand color changes the tiles and the preview but never the tool itself.
 * The tool wears these as CSS variables (shadcn role names) on its root element.
 */

import type { CSSProperties } from "react";
import { PRESETS, generateTokens } from "@/lib/design-system";
import { withAlpha } from "@/lib/design-system/color-math";

// The tool's own design system: the Blank slate preset (pure gray neutrals) with a near black brand color, so the
// whole interface is black, white and gray. Indigo only ever appears as a sample of the user's own brand color.
const TOOL_BRAND = "#171717";
const blank = PRESETS["blank-slate"].settings;
const own = generateTokens({ ...blank, colors: { ...blank.colors, brand: TOOL_BRAND } });
const { roles, neutral, semantic } = own.colors;
const shadow = (level: number) => own.elevation.shadows[level].css;

const shared = {
  // shadcn derives its "md" radius as 0.8 of this, which makes every small control 10px.
  "--radius": "12.5px",
  "--t-radius-sm": `${own.radius.sm}px`,
  "--t-radius-md": `${own.radius.md}px`,
  "--t-radius-lg": `${own.radius.lg}px`,
  "--t-shadow-xs": shadow(1),
  "--t-shadow-sm": shadow(2),
  "--t-shadow-md": shadow(3),
} as const;

const LIGHT: Record<string, string> = {
  ...shared,
  "--background": roles.background,
  "--foreground": neutral[900],
  // Tiles and list items sit on a faint gray with a hairline border.
  "--card": neutral[50],
  "--card-foreground": neutral[900],
  "--card-border": neutral[200],
  "--popover": roles.popover,
  "--popover-foreground": neutral[900],
  "--primary": neutral[900],
  "--primary-foreground": roles.background,
  "--secondary": neutral[200],
  "--secondary-foreground": neutral[900],
  "--muted": neutral[100],
  "--muted-foreground": neutral[600],
  "--accent": neutral[100],
  "--accent-foreground": neutral[900],
  "--destructive": semantic.error[600],
  "--border": neutral[200],
  "--input": roles.input,
  "--ring": neutral[900],
  "--t-surface": neutral[100],
  // A 1px outline for every color sample, a two tone ring for the user's own color, and the tooltip colors.
  "--t-outline": withAlpha(neutral[900], 0.14),
  "--t-ring-inner": roles.background,
  "--t-ring-outer": neutral[900],
  "--t-track": neutral[300],
  "--t-chip": neutral[700],
  "--t-primary-hover": neutral[700],
  "--t-primary-pressed": neutral[600],
  "--t-secondary-hover": neutral[300],
  "--t-secondary-pressed": neutral[400],
  "--t-brand-600": neutral[900],
  "--t-brand-700": neutral[700],
  "--t-success-50": semantic.success[50],
  "--t-success-700": semantic.success[700],
  "--t-warning-50": semantic.warning[50],
  "--t-warning-700": semantic.warning[700],
};

/** Dark: the same gray scale, read from the dark end. */
const DARK: Record<string, string> = {
  ...shared,
  "--background": neutral[900],
  "--foreground": neutral[50],
  "--card": neutral[800],
  "--card-foreground": neutral[50],
  "--card-border": neutral[700],
  "--popover": neutral[800],
  "--popover-foreground": neutral[50],
  "--primary": neutral[50],
  "--primary-foreground": neutral[900],
  "--secondary": neutral[700],
  "--secondary-foreground": neutral[50],
  "--muted": neutral[800],
  "--muted-foreground": neutral[400],
  "--accent": neutral[700],
  "--accent-foreground": neutral[50],
  "--destructive": semantic.error[600],
  "--border": neutral[700],
  "--input": neutral[500],
  "--ring": neutral[50],
  "--t-surface": neutral[800],
  "--t-outline": withAlpha(neutral[50], 0.22),
  "--t-ring-inner": neutral[900],
  "--t-ring-outer": neutral[50],
  "--t-track": neutral[600],
  "--t-chip": neutral[200],
  "--t-primary-hover": neutral[200],
  "--t-primary-pressed": neutral[300],
  "--t-secondary-hover": neutral[600],
  "--t-secondary-pressed": neutral[500],
  "--t-brand-600": neutral[50],
  "--t-brand-700": neutral[200],
  "--t-success-50": neutral[800],
  "--t-success-700": semantic.success[600],
  "--t-warning-50": neutral[800],
  "--t-warning-700": semantic.warning[600],
};

export const toolVars = (dark: boolean): CSSProperties => (dark ? DARK : LIGHT) as CSSProperties;
