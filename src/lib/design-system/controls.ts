/**
 * Buttons and inputs generator.
 *
 * Every state (hover, pressed, focus, disabled, loading) is derived from the base colors,
 * so changing the brand color or the secondary style updates all of them at once.
 *
 * Rules this file keeps:
 *  - Secondary comes from the neutral scale, or from the secondary color's scale if one was
 *    added. It never uses a status color such as warning.
 *  - Loading keeps the full button color and adds a spinner. Only disabled is faded.
 *  - Every focusable control shows the signature focus ring.
 *  - Form control outlines use the "input" border: the lightest neutral that reaches 3:1.
 */

import { contrastLevels, pickReadableText, relativeLuminance } from "./contrast";
import { WHITE, lightestShadeReaching, shiftKeepingHue } from "./colors";
import type {
  BorderTokens,
  ButtonState,
  ButtonVariant,
  ColorTokens,
  ControlSettings,
  ControlStateStyle,
  ControlTokens,
  IconTokens,
  InputState,
  RadiusTokens,
  SelectionControl,
  SelectionRule,
  SelectionState,
  SelectionStateStyle,
  SignatureTokens,
  SpacingTokens,
} from "./types";

const TRANSPARENT = "transparent";
const HOVER_SHIFT = -0.06;
const PRESSED_SHIFT = -0.12;

/** Rules for choosing between the three selection controls. */
export const SELECTION_RULES: SelectionRule[] = [
  {
    control: "radio",
    useWhen: "Exactly one choice from 2 to 5 visible options.",
    avoidWhen: "Long lists (use a select) or instant settings (use a switch).",
  },
  {
    control: "checkbox",
    useWhen: "Zero, one or several options, or consent, in a form.",
    avoidWhen: "Instant settings (use a switch) or a single choice (use radio).",
  },
  {
    control: "switch",
    useWhen: "An on or off setting that applies immediately, with no save button.",
    avoidWhen: "Form fields (use a checkbox) or three or more states (use radio).",
  },
];

interface ControlContext {
  colors: ColorTokens;
  radius: RadiusTokens;
  spacing: SpacingTokens;
  borders: BorderTokens;
  signature: SignatureTokens;
  icons: IconTokens;
}

const SELECTION_SIZE = 16;
const SWITCH = { width: 36, height: 20, thumb: 14 };
const SPINNER_CLASS = "ds-spinner";

const style = (
  background: string,
  color: string,
  borderColor: string,
  opacity = 1,
  spinner = false,
): ControlStateStyle => ({ background, color, borderColor, opacity, spinner });

/** Focus and loading both look like the default state. Focus adds the ring, loading adds a spinner. */
const withStates = (
  base: ControlStateStyle,
  hover: ControlStateStyle,
  pressed: ControlStateStyle,
  disabled: ControlStateStyle,
): Record<ButtonState, ControlStateStyle> => ({
  default: base,
  hover,
  pressed,
  focus: { ...base },
  disabled,
  loading: { ...base, spinner: true },
});

export function generateControls(settings: ControlSettings, ctx: ControlContext): ControlTokens {
  const { colors, radius, spacing, borders, signature, icons } = ctx;
  const { roles, neutral, brand, semantic, brandReport } = colors;
  const readable = (bg: string) => pickReadableText(bg, WHITE, neutral[900]);

  /** Solid-filled button (primary, destructive): darker on hover and press. */
  const solid = (base: string, fixedText?: string): Record<ButtonState, ControlStateStyle> => {
    // With one fixed text color (the primary button), every state keeps it. Dark text gets lighter hover and
    // pressed shades, because darker ones would drop below 4.5:1.
    const direction = fixedText !== undefined && relativeLuminance(fixedText) < 0.4 ? -1 : 1;
    const ease = direction === -1 ? 0.6 : 1; // lighter shades move less, so a light brand never washes out
    const hover = shiftKeepingHue(base, HOVER_SHIFT * direction * ease, 0.97);
    const pressed = shiftKeepingHue(base, PRESSED_SHIFT * direction * ease, 0.92);
    const text = (bg: string) => fixedText ?? readable(bg);
    return withStates(
      style(base, text(base), TRANSPARENT),
      style(hover, text(hover), TRANSPARENT),
      style(pressed, text(pressed), TRANSPARENT),
      style(neutral[100], neutral[400], TRANSPARENT),
    );
  };

  // Secondary: the neutral scale, or the secondary color's scale if one was added.
  const quiet = colors.secondary ?? neutral;
  const quietBorder = colors.secondary
    ? lightestShadeReaching(colors.secondary, roles.background, 3)
    : roles.input;
  // Without a secondary color the fill is neutral 200, 300 (hover) and 400 (pressed).
  // With one, it is that color's 100, 200 and 300.
  const [fillDefault, fillHover, fillPressed] = colors.secondary ? ([100, 200, 300] as const) : ([200, 300, 400] as const);
  const secondary =
    settings.secondaryStyle === "fill"
      ? withStates(
          style(quiet[fillDefault], quiet[900], TRANSPARENT),
          style(quiet[fillHover], quiet[900], TRANSPARENT),
          style(quiet[fillPressed], quiet[900], TRANSPARENT),
          style(neutral[100], neutral[400], TRANSPARENT),
        )
      : withStates(
          style(TRANSPARENT, quiet[900], quietBorder),
          style(quiet[100], quiet[900], quietBorder),
          style(quiet[200], quiet[900], quietBorder),
          style(TRANSPARENT, neutral[400], roles.border),
        );

  // Tertiary: no fill, brand text (the first step that reads at 4.5:1), a faint brand tint on hover and press.
  const brandText = brandReport.text;
  const tertiary = withStates(
    style(TRANSPARENT, brandText, TRANSPARENT),
    style(brand[50], brandText, TRANSPARENT),
    style(brand[100], brandText, TRANSPARENT),
    style(TRANSPARENT, neutral[400], TRANSPARENT),
  );

  // Destructive: solid red, unless the brand is close to the error red. Then it is tinted (light error tint, dark
  // error text) so it never looks like the primary button, and solid red is kept for confirmation dialogs.
  const destructiveSolid = solid(roles.destructive);
  const errorScale = semantic.error;
  const errorText = contrastLevels(errorScale[700], errorScale[50]).normal && contrastLevels(errorScale[700], errorScale[100]).normal ? errorScale[700] : errorScale[800];
  const destructiveTinted = withStates(
    style(errorScale[50], errorText, TRANSPARENT),
    style(errorScale[100], errorText, TRANSPARENT),
    style(errorScale[200], errorText, TRANSPARENT),
    style(neutral[100], neutral[400], TRANSPARENT),
  );
  const tintedDestructive = brandReport.nearError;

  const variants: Record<ButtonVariant, Record<ButtonState, ControlStateStyle>> = {
    primary: solid(roles.primary, roles["primary-foreground"]),
    secondary,
    tertiary,
    destructive: tintedDestructive ? destructiveTinted : destructiveSolid,
  };

  // Inputs: the input border by default, a brand border on focus (plus the focus ring).
  const field = (borderColor: string, background = roles.background, color = roles.foreground) =>
    style(background, color, borderColor);
  const inputStates: Record<InputState, ControlStateStyle> = {
    default: field(roles.input),
    hover: field(neutral[500]),
    focus: field(brandReport.focus),
    error: field(roles.destructive),
    disabled: field(roles.border, roles.muted, neutral[500]),
  };

  // Checkbox, radio and switch share one set of states. For the switch, markColor is the thumb.
  const selectionStates = (control: SelectionControl): Record<SelectionState, SelectionStateStyle> => {
    const off = control === "switch" ? roles.input : TRANSPARENT;
    const offHover = control === "switch" ? neutral[500] : TRANSPARENT;
    const offDisabled = control === "switch" ? neutral[300] : TRANSPARENT;
    const offError = control === "switch" ? roles.destructive : TRANSPARENT;
    return {
      default: { background: roles.background, borderColor: roles.input, markColor: off },
      hover: { background: roles.background, borderColor: neutral[500], markColor: offHover },
      checked: { background: roles.primary, borderColor: roles.primary, markColor: roles["primary-foreground"] },
      focus: { background: roles.background, borderColor: brandReport.focus, markColor: off },
      disabled: { background: roles.muted, borderColor: roles.border, markColor: offDisabled },
      error: { background: roles.background, borderColor: roles.destructive, markColor: offError },
    };
  };

  const height = settings.height;
  const buttonPaddingX = spacing.semantic.buttonPaddingX;
  const spinnerSize = icons.sizes.sm;

  return {
    secondaryStyle: settings.secondaryStyle,
    focusRing: signature.focusRing.css,
    buttons: {
      spinner: {
        size: spinnerSize,
        strokeWidth: 2,
        className: SPINNER_CLASS,
        // Reduced motion slows the spinner down instead of stopping it, so loading still reads as "working".
        stylesheet: [
          `@keyframes ds-spin {`,
          `  to { transform: rotate(360deg); }`,
          `}`,
          ``,
          `.${SPINNER_CLASS} {`,
          `  animation: ds-spin 0.8s linear infinite;`,
          `}`,
          ``,
          `@media (prefers-reduced-motion: reduce) {`,
          `  .${SPINNER_CLASS} {`,
          `    animation-duration: 2.4s;`,
          `  }`,
          `}`,
        ].join("\n"),
      },
      height: { sm: height - 8, md: height, lg: height + 8 },
      paddingX: { sm: buttonPaddingX - 4, md: buttonPaddingX, lg: buttonPaddingX + 4 },
      paddingY: spacing.semantic.buttonPaddingY,
      radius: radius.md,
      fontWeight: 500,
      borderWidth: borders.width,
      variants,
      destructiveStyle: tintedDestructive ? "tinted" : "solid",
      destructiveSolid,
    },
    inputs: {
      height,
      paddingX: spacing.semantic.inputPaddingX,
      paddingY: spacing.semantic.inputPaddingY,
      radius: radius.md,
      borderWidth: borders.width,
      placeholderColor: colors.placeholder,
      states: inputStates,
    },
    selection: {
      size: SELECTION_SIZE,
      switch: SWITCH,
      radius: { checkbox: radius.sm, radio: radius.full, switch: radius.full },
      borderWidth: borders.width,
      states: {
        checkbox: selectionStates("checkbox"),
        radio: selectionStates("radio"),
        switch: selectionStates("switch"),
      },
    },
    selectionRules: SELECTION_RULES,
  };
}
