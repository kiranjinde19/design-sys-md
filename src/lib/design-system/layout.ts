/** Layout tokens: the page shell, content width, page padding and breakpoints. */

import type { ControlTokens, LayoutTokens, SpacingTokens } from "./types";

export function generateLayout(spacing: SpacingTokens, controls: ControlTokens): LayoutTokens {
  const ladder = spacing.scale.map((step) => step.px);
  // Page padding grows with the screen: a stack gap on phones, a card padding on tablets, one ladder step more on desktops.
  const next = ladder.find((px) => px > spacing.semantic.cardPadding) ?? spacing.semantic.cardPadding;
  return {
    maxContentWidth: 1280,
    dialogWidth: 448,
    overlayOpacity: 0.4,
    headerHeight: controls.buttons.height.lg + spacing.semantic.inlineGap,
    sidebar: { width: 256, collapsed: controls.buttons.height.lg },
    pagePadding: { base: spacing.semantic.stackGap, md: spacing.semantic.cardPadding, lg: next },
    breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 },
  };
}
