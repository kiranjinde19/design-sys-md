/**
 * The tool's own colors. They come from the SaaS Clean preset and are FIXED: they never read the user's
 * design system, so editing a brand color changes the tiles and the preview but never the tool itself.
 * The tool wears these as CSS variables (shadcn role names) on its root element.
 */

import type { CSSProperties } from "react";
import { PRESETS, generateTokens } from "@/lib/design-system";

const own = generateTokens(PRESETS["saas-clean"].settings);
const { roles, brand, neutral, semantic } = own.colors;
const shadow = (level: number) => own.elevation.shadows[level].css;

const shared = {
  "--radius": "16px",
  "--t-radius-sm": `${own.radius.sm}px`,
  "--t-radius-md": `${own.radius.md}px`,
  "--t-radius-lg": `${own.radius.lg}px`,
  "--t-shadow-md": shadow(3),
} as const;

const LIGHT: Record<string, string> = {
  ...shared,
  "--background": roles.background,
  "--foreground": roles.foreground,
  "--card": roles.card,
  "--card-foreground": roles["card-foreground"],
  "--card-border": roles["card-border"],
  "--popover": roles.popover,
  "--popover-foreground": roles["popover-foreground"],
  "--primary": roles.primary,
  "--primary-foreground": roles["primary-foreground"],
  "--secondary": roles.secondary,
  "--secondary-foreground": roles["secondary-foreground"],
  "--muted": roles.muted,
  "--muted-foreground": roles["muted-foreground"],
  "--accent": roles.accent,
  "--accent-foreground": roles["accent-foreground"],
  "--destructive": roles.destructive,
  "--border": roles.border,
  "--input": roles.input,
  "--ring": roles.ring,
  "--t-brand-600": brand[600],
};

/** Dark: the same SaaS Clean scales, read from the dark end. */
const DARK: Record<string, string> = {
  ...shared,
  "--background": neutral[900],
  "--foreground": neutral[50],
  "--card": neutral[800],
  "--card-foreground": neutral[50],
  "--card-border": neutral[700],
  "--popover": neutral[800],
  "--popover-foreground": neutral[50],
  "--primary": brand[400],
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
  "--ring": brand[400],
  "--t-brand-600": brand[400],
};

export const toolVars = (dark: boolean): CSSProperties => (dark ? DARK : LIGHT) as CSSProperties;
