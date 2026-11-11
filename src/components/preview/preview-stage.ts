import type { CSSProperties } from "react";
import { useDesignSystem, type CssRecipe } from "@/lib/design-system";

/** A recipe from the design system, usable as a React style. */
export const asStyle = (recipe: CssRecipe) => recipe as CSSProperties;

/** The "page" that previews sit on, built only from design system tokens. */
export function usePreviewStage() {
  const { tokens } = useDesignSystem();
  const { colors, typography, borders, spacing, radius } = tokens;
  const body = typography.sizes.find((size) => size.name === "base")!;
  const small = typography.sizes.find((size) => size.name === "sm")!;

  const stage: CSSProperties = {
    background: colors.roles.background,
    color: colors.roles.foreground,
    fontFamily: typography.body.previewStack,
    fontSize: body.px,
    border: `${borders.width}px solid ${borders.color}`,
    borderRadius: radius.lg,
    padding: spacing.semantic.cardPadding,
  };

  return { tokens, stage, body, small };
}
