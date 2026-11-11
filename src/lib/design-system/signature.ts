/**
 * Signature details: the few memorable moves that make a product feel designed.
 * One pick per category. Each pick is turned into a ready-to-use style recipe.
 */

import { withAlpha } from "./color-math";
import { shadowAt } from "./elevation";
import type {
  BorderTokens,
  ColorTokens,
  CssRecipe,
  ElevationTokens,
  RadiusTokens,
  SignatureRecipe,
  SignatureSettings,
  SignatureTokens,
  SpacingTokens,
} from "./types";

interface CatalogOption<Id extends string> {
  id: Id;
  label: string;
  description: string;
}

type Catalog = {
  [K in keyof SignatureSettings]: {
    label: string;
    options: CatalogOption<SignatureSettings[K]>[];
  };
};

/** Every category and option, with plain-language labels for the editor. */
export const SIGNATURE_CATALOG: Catalog = {
  featuredHighlight: {
    label: "Featured highlight",
    options: [
      { id: "glow-border", label: "Glow border", description: "A soft brand-colored glow around the featured item." },
      { id: "offset-shadow", label: "Offset shadow", description: "A hard, solid shadow offset to one corner." },
      { id: "solid-accent-fill", label: "Solid accent fill", description: "The featured item is filled with the brand color." },
      { id: "corner-ribbon", label: "Corner ribbon", description: "A small ribbon in the top corner marks the featured item." },
    ],
  },
  cardStyle: {
    label: "Card style",
    options: [
      { id: "hairline-border", label: "Hairline border", description: "A thin border, no shadow." },
      { id: "soft-shadow", label: "Soft shadow", description: "No border, a gentle shadow lifts the card." },
      { id: "tinted-bento-tile", label: "Tinted bento tile", description: "A faintly brand-tinted tile with a soft edge." },
      { id: "glass-blur", label: "Glass blur", description: "A translucent card that blurs what is behind it." },
    ],
  },
  hover: {
    label: "Hover",
    options: [
      { id: "lift-2px", label: "Lift 2px", description: "The card rises 2px and its shadow deepens." },
      { id: "border-color-shift", label: "Border color shift", description: "The border changes to the brand color." },
      { id: "scale-1-02", label: "Scale 1.02", description: "The card grows slightly." },
      { id: "background-tint", label: "Background tint", description: "The background takes a faint brand tint." },
    ],
  },
  primaryCta: {
    label: "Primary call to action",
    options: [
      { id: "solid", label: "Solid", description: "A plain solid brand button." },
      { id: "border-beam", label: "Border beam", description: "A thin brand border with one streak of light travelling around it." },
      { id: "animated-glow-border", label: "Animated glow border", description: "A slow, soft glow pulses around the button." },
      { id: "gradient-fill", label: "Gradient fill", description: "A subtle brand gradient fill." },
      { id: "underline-sweep", label: "Underline sweep", description: "A text button with an underline that sweeps in on hover." },
    ],
  },
  iconContainer: {
    label: "Icon container",
    options: [
      { id: "bare", label: "Bare", description: "The icon on its own." },
      { id: "tinted-circle", label: "Tinted circle", description: "The icon inside a tinted circle." },
      { id: "rounded-square-tile", label: "Rounded square tile", description: "The icon inside a tinted rounded square." },
      { id: "outlined-badge", label: "Outlined badge", description: "The icon inside an outlined circle." },
    ],
  },
  focusRing: {
    label: "Focus ring",
    options: [
      { id: "offset-ring", label: "Offset ring", description: "A ring with a small gap around the element." },
      { id: "glow-ring", label: "Glow ring", description: "A soft glow around the element." },
      { id: "thick-outline", label: "Thick outline", description: "A bold outline hugging the element." },
    ],
  },
  divider: {
    label: "Divider",
    options: [
      { id: "hairline", label: "Hairline", description: "A thin solid line." },
      { id: "dotted", label: "Dotted", description: "A dotted line." },
      { id: "spacing-only", label: "Spacing only", description: "No line, only space between sections." },
      { id: "gradient-fade", label: "Gradient fade", description: "A line that fades out at both ends." },
    ],
  },
};

/** Defaults for the "SaaS Clean" preset. */
export const SAAS_CLEAN_SIGNATURE: SignatureSettings = {
  featuredHighlight: "glow-border",
  cardStyle: "tinted-bento-tile",
  hover: "lift-2px",
  primaryCta: "border-beam",
  iconContainer: "rounded-square-tile",
  focusRing: "offset-ring",
  divider: "hairline",
};

/** Defaults for the "Blank slate" preset: the quietest option in every category. */
export const BLANK_SLATE_SIGNATURE: SignatureSettings = {
  featuredHighlight: "solid-accent-fill",
  cardStyle: "hairline-border",
  hover: "border-color-shift",
  primaryCta: "solid",
  iconContainer: "bare",
  focusRing: "offset-ring",
  divider: "hairline",
};

const ICON_CONTAINER_SIZE = 40;
const CTA_GLOW_CLASS = "ds-cta-glow";
const CTA_BEAM_CLASS = "ds-cta-beam";
const HOVER_TRANSITION = "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease, background-color 150ms ease";

interface SignatureContext {
  colors: ColorTokens;
  radius: RadiusTokens;
  borders: BorderTokens;
  spacing: SpacingTokens;
  elevation: ElevationTokens;
}

function labelFor<K extends keyof SignatureSettings>(key: K, id: SignatureSettings[K]): string {
  const option = (SIGNATURE_CATALOG[key].options as CatalogOption<SignatureSettings[K]>[]).find(
    (o) => o.id === id,
  );
  return option?.label ?? String(id);
}

function recipe<K extends keyof SignatureSettings>(
  key: K,
  id: SignatureSettings[K],
  css: CssRecipe,
  notes?: string,
): SignatureRecipe<SignatureSettings[K]> {
  return { id, label: labelFor(key, id), css, notes };
}

export function generateSignature(
  settings: SignatureSettings,
  ctx: SignatureContext,
): SignatureTokens {
  const { colors, radius, borders, spacing, elevation } = ctx;
  const brand = colors.brand;
  const border = `${borders.width}px solid`;

  // Featured highlight
  const featuredCss: Record<SignatureSettings["featuredHighlight"], CssRecipe> = {
    "glow-border": {
      border: `${border} ${brand[500]}`,
      boxShadow: `0 0 0 1px ${withAlpha(brand[500], 0.35)}, 0 0 24px ${withAlpha(brand[500], 0.28)}`,
    },
    "offset-shadow": {
      border: `${border} ${colors.roles.foreground}`,
      boxShadow: `6px 6px 0 0 ${brand[600]}`,
    },
    "solid-accent-fill": {
      background: colors.roles.primary,
      color: colors.roles["primary-foreground"],
      border: `${border} ${colors.roles.primary}`,
    },
    "corner-ribbon": {
      border: `${border} ${brand[500]}`,
      position: "relative",
      overflow: "hidden",
    },
  };

  // Card style
  const cardCss: Record<SignatureSettings["cardStyle"], CssRecipe> = {
    "hairline-border": {
      background: colors.roles.background,
      border: `${border} ${borders.color}`,
      borderRadius: radius.lg,
    },
    "soft-shadow": {
      background: colors.roles.background,
      border: `${borders.width}px solid transparent`,
      borderRadius: radius.lg,
      boxShadow: shadowAt(elevation, 2),
    },
    "tinted-bento-tile": {
      background: colors.roles.card,
      border: `${border} ${colors.roles["card-border"]}`,
      borderRadius: radius.lg,
    },
    "glass-blur": {
      background: withAlpha(colors.roles.background, 0.6),
      border: `${border} ${withAlpha(colors.roles.background, 0.5)}`,
      borderRadius: radius.lg,
      backdropFilter: "blur(12px)",
    },
  };

  // Hover (only the properties that change on hover)
  const hoverCss: Record<SignatureSettings["hover"], CssRecipe> = {
    "lift-2px": { transform: "translateY(-2px)", boxShadow: shadowAt(elevation, 3), transition: HOVER_TRANSITION },
    "border-color-shift": { borderColor: colors.roles.primary, transition: HOVER_TRANSITION },
    "scale-1-02": { transform: "scale(1.02)", transition: HOVER_TRANSITION },
    "background-tint": { backgroundColor: brand[50], transition: HOVER_TRANSITION },
  };

  // Primary call to action
  const glowStatic = `0 0 0 2px ${withAlpha(brand[400], 0.65)}, 0 0 14px ${withAlpha(brand[400], 0.45)}`;
  const glowFrom = `0 0 0 1px ${withAlpha(brand[400], 0.5)}, 0 0 8px ${withAlpha(brand[400], 0.35)}`;
  const glowTo = `0 0 0 2px ${withAlpha(brand[400], 0.8)}, 0 0 20px ${withAlpha(brand[400], 0.55)}`;
  const ctaBase: CssRecipe = {
    background: colors.roles.primary,
    color: colors.roles["primary-foreground"],
  };
  const ctaCss: Record<SignatureSettings["primaryCta"], CssRecipe> = {
    solid: ctaBase,
    // The glow itself lives in the stylesheet below, so reduced motion can override it.
    "animated-glow-border": ctaBase,
    // The ring is a pseudo-element in the stylesheet below, so the button keeps its own fill, hover and disabled colors.
    "border-beam": ctaBase,
    "gradient-fill": {
      background: `linear-gradient(135deg, ${brand[500]}, ${brand[700]})`,
      color: colors.roles["primary-foreground"],
    },
    "underline-sweep": { background: "transparent", color: colors.roles.primary },
  };
  const beam = settings.primaryCta === "border-beam";
  const glow = settings.primaryCta === "animated-glow-border";
  const animated = beam || glow;

  // Icon container
  const iconCss: Record<SignatureSettings["iconContainer"], CssRecipe> = {
    bare: { color: colors.roles.primary },
    "tinted-circle": {
      width: ICON_CONTAINER_SIZE,
      height: ICON_CONTAINER_SIZE,
      borderRadius: radius.full,
      background: brand[100],
      color: brand[700],
    },
    "rounded-square-tile": {
      width: ICON_CONTAINER_SIZE,
      height: ICON_CONTAINER_SIZE,
      borderRadius: radius.md,
      background: brand[50],
      border: `${border} ${brand[100]}`,
      color: brand[700],
    },
    "outlined-badge": {
      width: ICON_CONTAINER_SIZE,
      height: ICON_CONTAINER_SIZE,
      borderRadius: radius.full,
      border: `${border} ${brand[300]}`,
      color: brand[700],
    },
  };

  // Focus ring
  const focusCss: Record<SignatureSettings["focusRing"], CssRecipe> = {
    "offset-ring": { outline: `2px solid ${brand[500]}`, outlineOffset: 2 },
    "glow-ring": { outline: "none", boxShadow: `0 0 0 4px ${withAlpha(brand[500], 0.3)}` },
    "thick-outline": { outline: `3px solid ${brand[600]}`, outlineOffset: 0 },
  };

  // Divider
  const dividerCss: Record<SignatureSettings["divider"], CssRecipe> = {
    hairline: { height: 0, border: 0, borderTop: `1px solid ${borders.color}` },
    dotted: { height: 0, border: 0, borderTop: `${borders.width}px dotted ${borders.colorStrong}` },
    "spacing-only": { height: 0, border: 0, marginBlock: spacing.semantic.stackGap },
    "gradient-fade": {
      height: 1,
      border: 0,
      background: `linear-gradient(90deg, transparent, ${borders.color}, transparent)`,
    },
  };

  return {
    featuredHighlight: recipe(
      "featuredHighlight",
      settings.featuredHighlight,
      featuredCss[settings.featuredHighlight],
      settings.featuredHighlight === "corner-ribbon"
        ? "Add a small brand-colored ribbon in the top right corner of the featured item."
        : undefined,
    ),
    cardStyle: recipe("cardStyle", settings.cardStyle, cardCss[settings.cardStyle]),
    hover: recipe("hover", settings.hover, hoverCss[settings.hover]),
    primaryCta: {
      ...recipe(
        "primaryCta",
        settings.primaryCta,
        ctaCss[settings.primaryCta],
        settings.primaryCta === "underline-sweep"
          ? "On hover, an underline sweeps in from the left under the label."
          : beam
            ? "The beam is decorative: a 2px ring at the button edge. Button text and its contrast are unchanged."
            : undefined,
      ),
      animated,
      className: beam ? CTA_BEAM_CLASS : glow ? CTA_GLOW_CLASS : null,
      stylesheet: beam
        ? [
            `@property --beam-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }`,
            `.${CTA_BEAM_CLASS} { position: relative; border-color: ${brand[400]}; }`,
            `@supports (mask-composite: exclude) {`,
            `  .${CTA_BEAM_CLASS}::before {`,
            `    content: ""; position: absolute; inset: 0; padding: 2px; border-radius: inherit;`,
            `    --m: linear-gradient(black 0 0);`,
            `    background: conic-gradient(from var(--beam-angle), ${brand[400]} 75%, ${brand[100]});`,
            `    mask: var(--m) content-box, var(--m); mask-composite: exclude;`,
            `    animation: ds-beam 3.6s linear infinite;`,
            `  }`,
            `}`,
            `@keyframes ds-beam { to { --beam-angle: 360deg; } }`,
            `/* Reduced motion: steady brand-400 ring */`,
            `@media (prefers-reduced-motion: reduce) { .${CTA_BEAM_CLASS}::before { animation: none; background: ${brand[400]}; } }`,
          ].join("\n")
        : glow
        ? [
            `.${CTA_GLOW_CLASS} {`,
            `  box-shadow: ${glowFrom};`,
            `  animation: ds-glow-border 3.6s ease-in-out infinite;`,
            `}`,
            ``,
            `@keyframes ds-glow-border {`,
            `  0%, 100% { box-shadow: ${glowFrom}; }`,
            `  50% { box-shadow: ${glowTo}; }`,
            `}`,
            ``,
            `/* Reduced motion: no animation, a steady glow border instead. */`,
            `@media (prefers-reduced-motion: reduce) {`,
            `  .${CTA_GLOW_CLASS} {`,
            `    animation: none;`,
            `    box-shadow: ${glowStatic};`,
            `  }`,
            `}`,
          ].join("\n")
        : null,
      reducedMotionCss: glow ? { animation: "none", boxShadow: glowStatic } : beam ? { animation: "none" } : {},
    },
    iconContainer: recipe("iconContainer", settings.iconContainer, iconCss[settings.iconContainer]),
    focusRing: recipe("focusRing", settings.focusRing, focusCss[settings.focusRing]),
    divider: recipe("divider", settings.divider, dividerCss[settings.divider]),
  };
}
