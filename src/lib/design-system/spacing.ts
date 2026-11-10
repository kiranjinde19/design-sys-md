/**
 * Spacing generator.
 *
 * The ladder always follows the base grid (4px or 8px), so every gap lines up.
 * Density does not bend the ladder. It moves the semantic values (card padding,
 * section gaps...) one rung down for compact, or one rung up for spacious.
 */

import type { Density, SpacingRole, SpacingSettings, SpacingStep, SpacingTokens } from "./types";

/** Ladder steps, in units of the base. With a 4px base, "3" is 12px. */
const LADDER_UNITS = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16];

/** Where each semantic value sits at "comfortable" density, in px. */
const COMFORTABLE_ANCHORS: Record<SpacingRole, number> = {
  inlineGap: 8,
  stackGap: 16,
  controlPaddingX: 12,
  controlPaddingY: 8,
  cardPadding: 24,
  sectionGap: 48,
};

const DENSITY_SHIFT: Record<Density, number> = {
  compact: -1,
  comfortable: 0,
  spacious: 1,
};

function nearestIndex(values: number[], target: number): number {
  let best = 0;
  values.forEach((value, index) => {
    if (Math.abs(value - target) < Math.abs(values[best] - target)) best = index;
  });
  return best;
}

export function generateSpacing({ base, density }: SpacingSettings): SpacingTokens {
  const scale: SpacingStep[] = LADDER_UNITS.map((unit) => ({
    key: String(unit),
    px: unit * base,
  }));
  const ladder = scale.map((step) => step.px);

  const semantic = {} as Record<SpacingRole, number>;
  (Object.keys(COMFORTABLE_ANCHORS) as SpacingRole[]).forEach((role) => {
    const anchor = nearestIndex(ladder, COMFORTABLE_ANCHORS[role]);
    const shifted = Math.min(ladder.length - 1, Math.max(0, anchor + DENSITY_SHIFT[density]));
    semantic[role] = ladder[shifted];
  });

  return { base, density, scale, semantic };
}
