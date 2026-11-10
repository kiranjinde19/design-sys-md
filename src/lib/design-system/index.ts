/** Public entry point for the design system engine. Import from "@/lib/design-system". */

export * from "./types";
export { generateTokens, createDesignSystem } from "./generate";
export { generateScale, generateBrandScale, generateNeutralScale, generateSemanticScales, generateColors, WHITE, BLACK } from "./colors";
export { checkContrast, contrastRatio, pickReadableText } from "./contrast";
export { normalizeHex } from "./color-math";
export { generateTypography, FONT_CATALOG } from "./typography";
export { generateRadius } from "./radius";
export { generateSpacing } from "./spacing";
export { generateBorders } from "./borders";
export { generateElevation, shadowAt } from "./elevation";
export { generateIcons } from "./icons";
export { generateControls } from "./controls";
export { generateSignature, SIGNATURE_CATALOG } from "./signature";
export { PRESETS, PRESET_IDS, DEFAULT_PRESET_ID, type PresetId } from "./presets";
export { normalizeSettings, applyPatch, type SettingsPatch } from "./normalize";
export { DesignSystemProvider, useDesignSystem } from "./provider";
