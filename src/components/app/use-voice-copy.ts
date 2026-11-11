"use client";

import { buildVoiceSamples, useDesignSystem } from "@/lib/design-system";

/**
 * Sample copy for the preview, written by the same code that writes the skill file's microcopy, so the
 * tone sliders change it. Sample lines only: they show tone, never terms or product claims.
 */
export function useVoiceCopy() {
  const { settings } = useDesignSystem();
  const samples = Object.fromEntries(buildVoiceSamples(settings.voice).map((sample) => [sample.id, sample]));
  return samples as unknown as Record<"button" | "empty" | "error" | "success" | "pricing", { main: string; extra: string }>;
}
