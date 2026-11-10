/** Puts every generator together: settings in, the full set of tokens out. */

import { generateBorders } from "./borders";
import { generateColors } from "./colors";
import { generateControls } from "./controls";
import { generateElevation } from "./elevation";
import { generateIcons } from "./icons";
import { generateRadius } from "./radius";
import { generateSignature } from "./signature";
import { generateSpacing } from "./spacing";
import { generateTypography } from "./typography";
import type { DesignSystem, DesignSystemSettings, DesignSystemTokens } from "./types";

export function generateTokens(settings: DesignSystemSettings): DesignSystemTokens {
  const colors = generateColors(settings.colors, { cardStyle: settings.signature.cardStyle });
  const typography = generateTypography(settings.typography);
  const icons = generateIcons(settings.icons);
  const radius = generateRadius(settings.radius);
  const spacing = generateSpacing(settings.spacing);
  const borders = generateBorders(settings.borders, colors.neutral, colors.roles.input);
  const elevation = generateElevation(settings.elevation, colors);
  const signature = generateSignature(settings.signature, { colors, radius, borders, spacing, elevation });
  const controls = generateControls(settings.controls, { colors, radius, spacing, borders, signature, icons });

  return { colors, typography, icons, radius, spacing, borders, elevation, controls, signature };
}

export function createDesignSystem(settings: DesignSystemSettings): DesignSystem {
  return { settings, tokens: generateTokens(settings) };
}
