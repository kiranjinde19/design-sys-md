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
  searchFonts,
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
export {
  VOICE_AXES,
  buildVoiceSamples,
  sampleText,
  voiceLevelLabel,
  voiceSummary,
  voicePrinciples,
  voiceWordChoices,
  voiceMicrocopy,
  type VoiceAxis,
  type VoiceSample,
} from "./voice";
export { generateSkillFile, type GeneratedFile } from "./skill/generate";
export { parseSkillFile } from "./skill/data-block";
export { STACK_LABELS, skillSlug } from "./skill/context";
export { SYSTEMS, isSystemId, type SystemId } from "./systems";
export { featuredHoverFix } from "./skill/signature";
export { SELECTION_RULES } from "./controls";
export {
  ROLE_ROWS,
  PILL_MEANING,
  allSwatches,
  assignRole,
  checkAssignment,
  describeRole,
  hasOverride,
  overrideCount,
  refLabel,
  resetRoles,
  rolePill,
  sentenceCase,
  swatchGroups,
  type RoleCheck,
  type RolePill,
  type SwatchGroup,
  type SwatchSource,
} from "./roles";
