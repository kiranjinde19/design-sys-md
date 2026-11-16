/**
 * Motion tokens: three durations and one easing curve. They are the same for every design (they are not a setting), and every
 * recipe that already transitions uses them. With reduced motion on, the generated CSS sets the durations to 0.
 */

import type { MotionTokens } from "./types";

export function generateMotion(): MotionTokens {
  return {
    durations: { fast: 120, base: 200, slow: 320 },
    easing: "cubic-bezier(0.2, 0, 0, 1)",
    hoverTransition: ["transform", "box-shadow", "border-color", "background-color"].map((property) => `${property} var(--t-fast) var(--ease)`).join(", "),
  };
}
