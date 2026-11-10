import { VOICE_AXES, buildVoiceSamples, voiceMicrocopy, voicePrinciples, voiceSummary, voiceWordChoices } from "../voice";
import { lines, table, type SkillContext } from "./context";

/** The voice is described in words, never in numbers, so a label can not contradict its value. */
export function voiceSection(ctx: SkillContext): string[] {
  const voice = ctx.s.voice;
  const words = voiceWordChoices(voice);
  const pricing = buildVoiceSamples(voice).find((s) => s.id === "pricing")!;
  return lines(
    "## Tone of voice",
    "",
    `Voice: **${voiceSummary(voice)}** (${VOICE_AXES.map((axis) => `${axis.low.toLowerCase()} to ${axis.high.toLowerCase()}`).join("; ")}). Write every label, message and heading in it.`,
    "",
    voicePrinciples(voice).map((p, i) => `${i + 1}. ${p}`),
    "",
    `Reach for: ${words.use.join(", ")}. Avoid: ${words.avoid.join(", ")}.`,
    "",
    "Buttons name the action, errors say what happened and what to do, empty states say what belongs there, confirmations say what changed. These lines show tone, not facts: write what is true for the product.",
    "",
    ...table(["Where", "Do", "Don't"], voiceMicrocopy(voice).map((m) => [m.category, m.doText, m.dontText])),
    "",
    `Pricing tone example (tone only, never copy it): "${pricing.main}. ${pricing.extra}" Write button labels and supporting lines that are true for this product's plans and terms.`,
    "",
  );
}
