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
  const text = colors.roles.foreground;
  const { roles } = colors;
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

  // Secondary follows the "secondary" role: the optional secondary color, or a quiet neutral fill.
  const secondaryBase = roles.secondary;
  const secondaryHover = shiftLightness(secondaryBase, HOVER_SHIFT);
  const secondaryPressed = shiftLightness(secondaryBase, PRESSED_SHIFT);
  const secondary: Record<ButtonState, ControlStateStyle> =
    settings.secondaryStyle === "fill"
      ? {
          default: style(secondaryBase, roles["secondary-foreground"], TRANSPARENT),
          hover: style(secondaryHover, readable(secondaryHover), TRANSPARENT),
          pressed: style(secondaryPressed, readable(secondaryPressed), TRANSPARENT),
          disabled: style(neutral[100], neutral[400], TRANSPARENT),
          loading: style(secondaryBase, roles["secondary-foreground"], TRANSPARENT, LOADING_OPACITY),
        }
      : {
          default: style(TRANSPARENT, text, roles.input),
          hover: style(neutral[50], text, roles.input),
          pressed: style(neutral[100], text, roles.input),
          disabled: style(TRANSPARENT, neutral[400], roles.border),
          loading: style(TRANSPARENT, text, roles.input, LOADING_OPACITY),
        };

  // Tertiary (ghost) buttons highlight with the "accent" role, like shadcn.
  const accentPressed = shiftLightness(roles.accent, HOVER_SHIFT);
  const tertiary: Record<ButtonState, ControlStateStyle> = {
    default: style(TRANSPARENT, text, TRANSPARENT),
    hover: style(roles.accent, roles["accent-foreground"], TRANSPARENT),
    pressed: style(accentPressed, readable(accentPressed), TRANSPARENT),
    disabled: style(TRANSPARENT, neutral[400], TRANSPARENT),
    loading: style(TRANSPARENT, text, TRANSPARENT, LOADING_OPACITY),
  };

  const variants: Record<ButtonVariant, Record<ButtonState, ControlStateStyle>> = {
    primary: solid(roles.primary),
    secondary,
    tertiary,
    destructive: solid(roles.destructive),
  };

  const inputStates: Record<InputState, ControlStateStyle> = {
    default: style(roles.background, text, roles.input),
    hover: style(roles.background, text, neutral[400]),
    focus: style(roles.background, text, roles.ring),
    error: style(roles.background, text, roles.destructive),
    disabled: style(roles.muted, neutral[500], roles.border),
  };

  const height = settings.height;
  const buttonPaddingX = spacing.semantic.buttonPaddingX;

  return {
    secondaryStyle: settings.secondaryStyle,
    buttons: {
      height: { sm: height - 8, md: height, lg: height + 8 },
      paddingX: { sm: buttonPaddingX - 4, md: buttonPaddingX, lg: buttonPaddingX + 4 },
      paddingY: spacing.semantic.buttonPaddingY,
      radius: radius.md,
      fontWeight: 500,
      borderWidth: borders.width,
      variants,
    },
    inputs: {
      height,
      paddingX: spacing.semantic.inputPaddingX,
      paddingY: spacing.semantic.inputPaddingY,
      radius: radius.md,
      borderWidth: borders.width,
      placeholderColor: neutral[500],
      states: inputStates,
    },
    selectionRules: SELECTION_RULES,
  };
}
