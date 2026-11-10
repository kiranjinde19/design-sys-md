/**
 * Buttons and inputs generator.
 *
 * Every state (hover, pressed, disabled, loading) is derived from the base colors,
 * so changing the brand color or the secondary style updates all of them at once.
 * The focus ring comes from the signature details, not from here.
 */

import { shiftLightness } from "./color-math";
import { pickReadableText } from "./contrast";
import { WHITE } from "./colors";
import type {
  BorderTokens,
  ButtonState,
  ButtonVariant,
  ColorTokens,
  ControlSettings,
  ControlStateStyle,
  ControlTokens,
  InputState,
  RadiusTokens,
  SelectionRule,
  SpacingTokens,
} from "./types";

const TRANSPARENT = "transparent";
const HOVER_SHIFT = -0.06;
const PRESSED_SHIFT = -0.12;
const LOADING_OPACITY = 0.7;

/** Rules for choosing between the three selection controls. */
export const SELECTION_RULES: SelectionRule[] = [
  {
    control: "radio",
    useWhen: "The user must pick exactly one option from a short list (2 to 5) and should see every option at once.",
    avoidWhen: "The list is long (use a select), or the choice takes effect immediately (use a switch).",
  },
  {
    control: "checkbox",
    useWhen: "The user can pick zero, one or several options, or must confirm something (terms, consent) before submitting.",
    avoidWhen: "The setting applies instantly with no submit (use a switch), or only one option may be chosen (use radio).",
  },
  {
    control: "switch",
    useWhen: "A setting turns on or off and the change applies immediately, with no save button.",
    avoidWhen: "The choice is part of a form that gets submitted (use a checkbox), or there are more than two states (use radio).",
  },
];

interface ControlContext {
  colors: ColorTokens;
  radius: RadiusTokens;
  spacing: SpacingTokens;
  borders: BorderTokens;
}

const style = (
  background: string,
  color: string,
  borderColor: string,
  opacity = 1,
): ControlStateStyle => ({ background, color, borderColor, opacity });

export function generateControls(settings: ControlSettings, ctx: ControlContext): ControlTokens {
  const { colors, radius, spacing, borders } = ctx;
  const neutral = colors.neutral;
  const text = colors.roles.text;
  const readable = (bg: string) => pickReadableText(bg, WHITE, neutral[900]);

  /** Solid-filled button (primary, destructive): darker on hover and press. */
  const solid = (base: string): Record<ButtonState, ControlStateStyle> => {
    const hover = shiftLightness(base, HOVER_SHIFT);
    const pressed = shiftLightness(base, PRESSED_SHIFT);
    return {
      default: style(base, readable(base), TRANSPARENT),
      hover: style(hover, readable(hover), TRANSPARENT),
      pressed: style(pressed, readable(pressed), TRANSPARENT),
      disabled: style(neutral[100], neutral[400], TRANSPARENT),
      loading: style(base, readable(base), TRANSPARENT, LOADING_OPACITY),
    };
  };

  const secondary: Record<ButtonState, ControlStateStyle> =
    settings.secondaryStyle === "fill"
      ? {
          default: style(neutral[100], text, TRANSPARENT),
          hover: style(neutral[200], text, TRANSPARENT),
          pressed: style(neutral[300], text, TRANSPARENT),
          disabled: style(neutral[100], neutral[400], TRANSPARENT),
          loading: style(neutral[100], text, TRANSPARENT, LOADING_OPACITY),
        }
      : {
          default: style(TRANSPARENT, text, borders.colorStrong),
          hover: style(neutral[50], text, borders.colorStrong),
          pressed: style(neutral[100], text, borders.colorStrong),
          disabled: style(TRANSPARENT, neutral[400], borders.color),
          loading: style(TRANSPARENT, text, borders.colorStrong, LOADING_OPACITY),
        };

  const tertiary: Record<ButtonState, ControlStateStyle> = {
    default: style(TRANSPARENT, text, TRANSPARENT),
    hover: style(neutral[100], text, TRANSPARENT),
    pressed: style(neutral[200], text, TRANSPARENT),
    disabled: style(TRANSPARENT, neutral[400], TRANSPARENT),
    loading: style(TRANSPARENT, text, TRANSPARENT, LOADING_OPACITY),
  };

  const variants: Record<ButtonVariant, Record<ButtonState, ControlStateStyle>> = {
    primary: solid(colors.roles.primary),
    secondary,
    tertiary,
    destructive: solid(colors.semantic.error[600]),
  };

  const inputStates: Record<InputState, ControlStateStyle> = {
    default: style(colors.roles.background, text, borders.colorStrong),
    hover: style(colors.roles.background, text, neutral[400]),
    focus: style(colors.roles.background, text, colors.roles.primary),
    error: style(colors.roles.background, text, colors.semantic.error[600]),
    disabled: style(colors.roles.surfaceMuted, neutral[500], borders.color),
  };

  const height = settings.height;
  const paddingX = spacing.semantic.controlPaddingX;

  return {
    secondaryStyle: settings.secondaryStyle,
    buttons: {
      height: { sm: height - 8, md: height, lg: height + 8 },
      paddingX: { sm: paddingX - 4, md: paddingX, lg: paddingX + 4 },
      radius: radius.md,
      fontWeight: 500,
      borderWidth: borders.width,
      variants,
    },
    inputs: {
      height,
      paddingX,
      radius: radius.md,
      borderWidth: borders.width,
      placeholderColor: neutral[500],
      states: inputStates,
    },
    selectionRules: SELECTION_RULES,
  };
}
