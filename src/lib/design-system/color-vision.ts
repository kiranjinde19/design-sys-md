/**
 * Color vision simulation, used to keep the chart colors apart for people with color blindness.
 * Uses the Machado et al. (2009) matrices at full severity, on linear light.
 */

import { hexToRgb, toLinear } from "./color-math";

type Matrix = [[number, number, number], [number, number, number], [number, number, number]];
export type VisionKind = "normal" | "deuteranopia" | "protanopia" | "tritanopia";

const MATRICES: Record<VisionKind, Matrix> = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};

export const VISION_KINDS = Object.keys(MATRICES) as VisionKind[];

type Lab = [number, number, number];

function linearToOklab(r: number, g: number, b: number): Lab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** How a color looks to someone with the given vision, as an OKLab point. */
export function seenAs(hex: string, kind: VisionKind): Lab {
  const { r, g, b } = hexToRgb(hex);
  const v = [toLinear(r), toLinear(g), toLinear(b)];
  const [row0, row1, row2] = MATRICES[kind];
  const mix = (row: number[]) => Math.max(0, row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
  return linearToOklab(mix(row0), mix(row1), mix(row2));
}

const distance = (a: Lab, b: Lab) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** For every vision type, a color's appearance. Compute once per color, then compare many times. */
export type Appearance = Lab[];
export const appearanceOf = (hex: string): Appearance => VISION_KINDS.map((kind) => seenAs(hex, kind));

/** The smallest difference between two colors across all vision types. Bigger is easier to tell apart. */
export function worstCaseDistance(a: Appearance, b: Appearance): number {
  let worst = Infinity;
  for (let i = 0; i < a.length; i++) worst = Math.min(worst, distance(a[i], b[i]));
  return worst;
}
