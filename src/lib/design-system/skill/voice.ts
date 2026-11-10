import { VOICE_AXES, voiceMicrocopy, voicePrinciples, voiceSummary, voiceWordChoices } from "../voice";
import { lines, table, type SkillContext } from "./context";

export function voiceSection(ctx: SkillContext): string[] {
  const voice = ctx.s.voice;
  const words = voiceWordChoices(voice);
  return lines(
    "## 4. Tone of voice",
    "",
    `Voice: **${voiceSummary(voice)}** (${VOICE_AXES.map((axis) => `${axis.title.toLowerCase()} ${voice[axis.key]}/5`).join(", ")}). Write every label, message and heading in this voice.`,
    "",
    "### Principles",
    "",
    voicePrinciples(voice).map((p, i) => `${i + 1}. ${p}`),
    "",
    "### Word choices",
    "",
    `- Reach for: ${words.use.join(", ")}.`,
    `- Avoid: ${words.avoid.join(", ")}.`,
    "",
    "### Do and don't microcopy",
    "",
    "These show the tone. They are not facts about the product. Write what is true, in this voice.",
    "",
    ...table(["Where", "Do", "Don't", "Why"], voiceMicrocopy(voice).map((m) => [m.category, m.doText, m.dontText, m.why])),
    "",
  );
}
