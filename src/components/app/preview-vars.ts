/**
 * Hands the user's design system to the preview as CSS variables. The preview container receives these and
 * nothing else, so it is the only part of the screen that changes when the user edits.
 */

import type { CSSProperties } from "react";
import type { DesignSystemTokens } from "@/lib/design-system";

export function previewVars(tokens: DesignSystemTokens): CSSProperties {
  const { colors, typography, radius, spacing, borders, elevation, controls } = tokens;
  const vars: Record<string, string | number> = {
    "--pv-font-heading": typography.heading.previewStack,
    "--pv-font-body": typography.body.previewStack,
    "--pv-heading-weight": typography.headingWeight,
    "--pv-body-weight": typography.bodyWeight,
    "--pv-tracking": `${typography.headingTracking}em`,
    "--pv-radius-sm": `${radius.sm}px`,
    "--pv-radius-md": `${radius.md}px`,
    "--pv-radius-lg": `${radius.lg}px`,
    "--pv-radius-full": `${radius.full}px`,
    "--pv-pad-card": `${spacing.semantic.cardPadding}px`,
    "--pv-gap-stack": `${spacing.semantic.stackGap}px`,
    "--pv-gap-inline": `${spacing.semantic.inlineGap}px`,
    "--pv-gap-section": `${spacing.semantic.sectionGap}px`,
    "--pv-border-w": `${borders.width}px`,
    "--pv-border": borders.color,
    "--pv-control-h": `${controls.buttons.height.md}px`,
    "--pv-btn-px": `${controls.buttons.paddingX.md}px`,
    "--pv-btn-radius": `${controls.buttons.radius}px`,
    "--pv-btn-weight": controls.buttons.fontWeight,
    "--pv-btn-bw": `${controls.buttons.borderWidth}px`,
    "--pv-header-h": `${tokens.layout.headerHeight}px`,
    "--pv-content-max": `${tokens.layout.maxContentWidth}px`,
  };
  for (const name of ["background", "foreground", "card", "card-foreground", "muted", "muted-foreground", "primary", "primary-foreground", "border", "input"] as const) {
    vars[`--pv-${name}`] = colors.roles[name];
  }
  vars["--pv-brand-text"] = colors.brandReport.text;
  for (const [step, hex] of Object.entries(colors.brand)) vars[`--pv-brand-${step}`] = hex;
  for (const size of typography.sizes) {
    vars[`--pv-text-${size.name}`] = `${size.px}px`;
    vars[`--pv-leading-${size.name}`] = `${size.lineHeightPx}px`;
  }
  elevation.shadows.forEach((shadow) => (vars[`--pv-shadow-${shadow.level}`] = shadow.css));
  for (const variant of ["primary", "secondary", "tertiary"] as const) {
    const states = controls.buttons.variants[variant];
    vars[`--pv-${variant}-bg`] = states.default.background;
    vars[`--pv-${variant}-fg`] = states.default.color;
    vars[`--pv-${variant}-bd`] = states.default.borderColor;
    vars[`--pv-${variant}-hover`] = states.hover.background;
    vars[`--pv-${variant}-active`] = states.pressed.background;
  }
  return vars as CSSProperties;
}
