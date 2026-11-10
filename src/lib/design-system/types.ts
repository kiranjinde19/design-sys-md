/**
 * The central design system object.
 *
 * Two layers:
 *  1. DesignSystemSettings: the small set of simple choices a founder makes
 *     (a brand color, a radius number, a density...). This is what gets saved.
 *  2. DesignSystemTokens: the full set of generated values (scales, ladders,
 *     shadows, component recipes). Always derived from the settings, never saved.
 */

// ─────────────────────────────────────────────────────────────
// Shared building blocks
// ─────────────────────────────────────────────────────────────

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type ScaleStep = (typeof SCALE_STEPS)[number];
export type ColorScale = Record<ScaleStep, string>;

/** The step where the exact brand color is placed in the brand scale. */
export const BRAND_STEP: ScaleStep = 600;

export type NeutralTone = "cool" | "warm" | "pure" | "brand";
export type SemanticName = "success" | "warning" | "error" | "info";
export type ScaleName = "brand" | "neutral" | SemanticName;

/** Points at one color: a fixed white/black, or one step of one scale. */
export type ColorRef =
  | { scale: "white" | "black" }
  | { scale: ScaleName; step: ScaleStep };

/**
 * Color roles use the exact shadcn/ui names, so each one maps straight onto a
 * shadcn CSS variable (--background, --card-foreground, --ring...).
 */
export const SHADCN_ROLE_NAMES = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
] as const;
export type ColorRoleTokenName = (typeof SHADCN_ROLE_NAMES)[number];

/**
 * The roles a user can assign to a swatch. The rest are worked out automatically:
 * the foregrounds that sit on a colored fill are picked for readable contrast,
 * card-foreground follows foreground, and secondary and accent follow the
 * optional secondary color (or the neutral grays when there is none).
 */
export const COLOR_ROLE_NAMES = [
  "background",
  "foreground",
  "card",
  "primary",
  "muted",
  "muted-foreground",
  "destructive",
  "border",
  "input",
  "ring",
] as const;
export type ColorRoleName = (typeof COLOR_ROLE_NAMES)[number];

export type Density = "compact" | "comfortable" | "spacious";
export type ElevationStyle = "soft" | "hard" | "brand-tinted";
export type FontWeight = 400 | 500 | 600 | 700;
export type IconStyle = "outline" | "solid" | "duotone";
export type IconEnds = "round" | "sharp";
export type SecondaryButtonStyle = "fill" | "outline";

// Signature detail options (one pick per category)
export type FeaturedHighlight = "glow-border" | "offset-shadow" | "solid-accent-fill" | "corner-ribbon";
export type CardStyle = "hairline-border" | "soft-shadow" | "tinted-bento-tile" | "glass-blur";
export type HoverEffect = "lift-2px" | "border-color-shift" | "scale-1-02" | "background-tint";
export type PrimaryCta = "solid" | "animated-glow-border" | "gradient-fill" | "underline-sweep";
export type IconContainer = "bare" | "tinted-circle" | "rounded-square-tile" | "outlined-badge";
export type FocusRingStyle = "offset-ring" | "glow-ring" | "thick-outline";
export type DividerStyle = "hairline" | "dotted" | "spacing-only" | "gradient-fade";

// ─────────────────────────────────────────────────────────────
// Layer 1: settings (what the user chooses, and what is saved)
// ─────────────────────────────────────────────────────────────

export interface ColorSettings {
  /** One hex color, e.g. "#4F46E5". Placed at step 600 of the brand scale. */
  brand: string;
  /** Optional second brand color. null means the product uses one brand color only. */
  secondary: string | null;
  neutralTone: NeutralTone;
  /** Which swatch plays which role. Primary, surface and background are draggable later. */
  roles: Record<ColorRoleName, ColorRef>;
}

export interface TypographySettings {
  headingFont: string;
  bodyFont: string;
  /** Base size in px. */
  baseSize: number;
  /** Type scale ratio, 1.125 to 1.5. */
  scaleRatio: number;
  /** Body line height, unitless. */
  lineHeight: number;
  headingWeight: FontWeight;
  bodyWeight: FontWeight;
}

export interface IconSettings {
  style: IconStyle;
  /** 1 to 3 px, in steps of 0.25. */
  strokeWidth: number;
  ends: IconEnds;
}

export interface RadiusSettings {
  /** The medium radius in px, 0 to 24. Small, large and full are derived. */
  base: number;
}

export interface SpacingSettings {
  base: 4 | 8;
  density: Density;
}

export interface BorderSettings {
  width: 1 | 2;
  /** Which step of the neutral scale borders use. */
  colorStep: ScaleStep;
}

export interface ElevationSettings {
  /** How many shadow levels exist above "none", 0 to 5. */
  levels: number;
  /** 0 (barely there) to 100 (heavy). 50 is medium. */
  intensity: number;
  style: ElevationStyle;
}

export interface ControlSettings {
  secondaryStyle: SecondaryButtonStyle;
  /** Default control height in px. Small and large are derived. */
  height: number;
}

export interface SignatureSettings {
  featuredHighlight: FeaturedHighlight;
  cardStyle: CardStyle;
  hover: HoverEffect;
  primaryCta: PrimaryCta;
  iconContainer: IconContainer;
  focusRing: FocusRingStyle;
  divider: DividerStyle;
}

export const SETTINGS_SCHEMA_VERSION = 1;

export interface DesignSystemSettings {
  schemaVersion: typeof SETTINGS_SCHEMA_VERSION;
  colors: ColorSettings;
  typography: TypographySettings;
  icons: IconSettings;
  radius: RadiusSettings;
  spacing: SpacingSettings;
  borders: BorderSettings;
  elevation: ElevationSettings;
  controls: ControlSettings;
  signature: SignatureSettings;
}

// ─────────────────────────────────────────────────────────────
// Layer 2: tokens (everything generated from the settings)
// ─────────────────────────────────────────────────────────────

// Colors
export type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail";

export interface ContrastResult {
  /** Contrast ratio, rounded down to 2 decimals so a near miss never reads as a pass. */
  ratio: number;
  level: WcagLevel;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  /** Short badge text, e.g. "AA 6.29:1" or "Fail 2.10:1". */
  label: string;
}


/** Pass or fail at each of the three WCAG levels. */
export interface ContrastLevels {
  /** Contrast ratio, rounded down to 2 decimals. */
  ratio: number;
  /** 4.5:1, normal text (AA). */
  normal: boolean;
  /** 3:1, large text and UI parts like borders, icons and focus rings. */
  large: boolean;
  /** 7:1, enhanced contrast (AAA). */
  aaa: boolean;
}

export interface StepContrast {
  onWhite: ContrastLevels;
  onBlack: ContrastLevels;
}

/** Which steps of a scale are safe to use as a filled background. */
export interface ScaleGuidance {
  /** Lightest step that takes white text at 4.5:1. That step and every darker one are safe. */
  whiteTextFrom: ScaleStep | null;
  /** Darkest step that takes dark text (the neutral 900 ink) at 4.5:1. That step and every lighter one are safe. */
  darkTextUpTo: ScaleStep | null;
}

export interface ScaleReport {
  contrast: Record<ScaleStep, StepContrast>;
  guidance: ScaleGuidance;
}

export interface ContrastPair {
  id: string;
  label: string;
  /** Role names, e.g. "primary-foreground" on "primary". */
  foregroundRole: ColorRoleTokenName;
  backgroundRole: ColorRoleTokenName;
  foreground: string;
  background: string;
  /** "text" pairs need 4.5:1. "ui" pairs (borders, input outlines, focus rings) need 3:1. */
  kind: "text" | "ui";
  required: 4.5 | 3;
  /** Whether the pair reaches its required ratio. */
  passes: boolean;
  levels: ContrastLevels;
  result: ContrastResult;
}

export interface ColorTokens {
  brand: ColorScale;
  /** Only present when the user chose a secondary color. */
  secondary: ColorScale | null;
  neutral: ColorScale;
  semantic: Record<SemanticName, ColorScale>;
  /** All 17 shadcn roles as hex colors. */
  roles: Record<ColorRoleTokenName, string>;
  /** Contrast at three levels for every step, plus safe-fill guidance, for every scale. */
  reports: {
    brand: ScaleReport;
    secondary: ScaleReport | null;
    neutral: ScaleReport;
    semantic: Record<SemanticName, ScaleReport>;
  };
  contrastPairs: ContrastPair[];
}

// Typography
export type TypeSizeName = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

export interface FontToken {
  name: string;
  /** Full CSS font-family stack for the generated file. */
  stack: string;
  /** Stack that works inside this app's own preview (uses the loaded font). */
  previewStack: string;
}

export interface TypeSizeToken {
  name: TypeSizeName;
  /** Position on the ladder: base is 0, lg is 1, sm is -1. */
  step: number;
  px: number;
  rem: number;
  lineHeight: number;
  letterSpacing: string;
}

export interface TypographyTokens {
  heading: FontToken;
  body: FontToken;
  baseSize: number;
  scaleRatio: number;
  bodyLineHeight: number;
  weights: { regular: number; medium: number; semibold: number; bold: number };
  headingWeight: number;
  bodyWeight: number;
  sizes: TypeSizeToken[];
}

// Radius, spacing, borders
export interface RadiusTokens {
  sm: number;
  md: number;
  lg: number;
  full: number;
}

export type SpacingRole =
  | "inlineGap"
  | "stackGap"
  | "buttonPaddingX"
  | "buttonPaddingY"
  | "inputPaddingX"
  | "inputPaddingY"
  | "cardPadding"
  | "sectionGap";

export interface SpacingStep {
  /** Name in units of the base, e.g. "4" or "1.5". */
  key: string;
  px: number;
}

export interface SpacingTokens {
  base: 4 | 8;
  density: Density;
  scale: SpacingStep[];
  /** Density-aware values used by components. */
  semantic: Record<SpacingRole, number>;
}

export interface BorderTokens {
  width: number;
  color: string;
  colorSubtle: string;
  colorStrong: string;
}

// Elevation
export interface ShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface ShadowToken {
  level: number;
  css: string;
  layers: ShadowLayer[];
}

export interface ElevationTokens {
  levels: number;
  intensity: number;
  style: ElevationStyle;
  /** Always starts with level 0 ("none"), then one entry per level. */
  shadows: ShadowToken[];
}

// Icons
export interface IconTokens {
  style: IconStyle;
  strokeWidth: number;
  strokeLinecap: "round" | "butt";
  strokeLinejoin: "round" | "miter";
  fill: "none" | "currentColor";
  /** Opacity of the secondary shape in duotone icons. */
  duotoneOpacity: number;
  sizes: { sm: number; md: number; lg: number };
}

// Buttons and inputs
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonState = "default" | "hover" | "pressed" | "disabled" | "loading";
export type InputState = "default" | "hover" | "focus" | "error" | "disabled";
export type ButtonSize = "sm" | "md" | "lg";

export interface ControlStateStyle {
  background: string;
  color: string;
  borderColor: string;
  opacity: number;
}

export interface SelectionRule {
  control: "radio" | "checkbox" | "switch";
  useWhen: string;
  avoidWhen: string;
}

export interface ControlTokens {
  secondaryStyle: SecondaryButtonStyle;
  buttons: {
    height: Record<ButtonSize, number>;
    paddingX: Record<ButtonSize, number>;
    paddingY: number;
    radius: number;
    fontWeight: number;
    borderWidth: number;
    variants: Record<ButtonVariant, Record<ButtonState, ControlStateStyle>>;
  };
  inputs: {
    height: number;
    paddingX: number;
    paddingY: number;
    radius: number;
    borderWidth: number;
    placeholderColor: string;
    states: Record<InputState, ControlStateStyle>;
  };
  selectionRules: SelectionRule[];
}

// Signature details
/** A bundle of CSS properties (camelCase, so it can be used as a React style). */
export type CssRecipe = Record<string, string | number>;

export interface SignatureRecipe<Id extends string> {
  id: Id;
  label: string;
  css: CssRecipe;
  /** Plain-language implementation note for parts CSS on one element cannot express. */
  notes?: string;
}

export interface SignatureTokens {
  featuredHighlight: SignatureRecipe<FeaturedHighlight>;
  cardStyle: SignatureRecipe<CardStyle>;
  hover: SignatureRecipe<HoverEffect>;
  primaryCta: SignatureRecipe<PrimaryCta> & {
    animated: boolean;
    /** Class name the stylesheet targets, or null when the CTA is not animated. */
    className: string | null;
    /**
     * Complete CSS for animated CTAs: the glow, the @keyframes, and the
     * prefers-reduced-motion fallback. Null when the CTA is not animated.
     */
    stylesheet: string | null;
    /** What the button shows when the user prefers reduced motion: no animation, a steady glow. */
    reducedMotionCss: CssRecipe;
  };
  iconContainer: SignatureRecipe<IconContainer>;
  focusRing: SignatureRecipe<FocusRingStyle>;
  divider: SignatureRecipe<DividerStyle>;
}

export interface DesignSystemTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  icons: IconTokens;
  radius: RadiusTokens;
  spacing: SpacingTokens;
  borders: BorderTokens;
  elevation: ElevationTokens;
  controls: ControlTokens;
  signature: SignatureTokens;
}

/** The whole design system: what was chosen, and everything generated from it. */
export interface DesignSystem {
  settings: DesignSystemSettings;
  tokens: DesignSystemTokens;
}
