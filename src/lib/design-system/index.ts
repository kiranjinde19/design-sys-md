/** Public entry point for the design system engine. Import from "@/lib/design-system". */

export * from "./types";
export { generateTokens, createDesignSystem } from "./generate";
export { generateScale, generateBrandScale, generateNeutralScale, generateSemanticScales, generateColors, suggestSecondaryColors, WHITE, BLACK } from "./colors";
export { checkContrast, contrastRatio, pickReadableText } from "./contrast";
export { normalizeHex } from "./color-math";
export { generateTypography, resolveFont, snapFontSize, MIN_FONT_SIZE } from "./typography";
export {
  FONT_CATALOG,
  FONT_CATEGORY_LABELS,
  WEIGHT_LABELS,
  SYSTEM_STACKS,
  catalogFont,
  defaultTracking,
  effectiveFont,
  getFont,
  isDisplayFont,
  nearestWeight,
  offeredWeights,
  sanitizeFontName,
  type FontEntry,
} from "./fonts";
export {
  FONT_PAIRINGS,
  PAIRING_SAMPLE_LINE,
  PAIRING_MONO_SAMPLE,
  pairingSettings,
  matchingPairingId,
  recommendBodyFonts,
  bodyFontWarnings,
  pairingGalleryUrl,
  type FontPairing,
  type BodyRecommendation,
} from "./font-pairings";
export { buildFontsUrl, selectedFontsUrl, fontNamesUrl, galleryFontsUrl, type FontRequest } from "./font-loading";
export { generateRadius, radiusLabel } from "./radius";
export { generateSpacing } from "./spacing";
export { generateBorders } from "./borders";
export { generateElevation, shadowAt } from "./elevation";
export { generateIcons } from "./icons";
export { generateControls } from "./controls";
export { generateSignature, SIGNATURE_CATALOG } from "./signature";
export { PRESETS, PRESET_IDS, DEFAULT_PRESET_ID, type PresetId } from "./presets";
export { normalizeSettings, applyPatch, type SettingsPatch } from "./normalize";
export { DesignSystemProvider, useDesignSystem } from "./provider";
