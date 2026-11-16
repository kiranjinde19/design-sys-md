/**
 * The starter prompt shown after a download: it names the file and the folder the chosen tool reads, so the user can paste it
 * into their AI tool as it is and only fill in what they want built. Plain words, no dashes (the folder name is the one
 * generated name, which has hyphens because folder names do).
 */

export type PromptFile = "skill" | "agents";

/** The text to copy. `slug` is the one generated name (the folder of the Claude Code skill). */
export function starterPrompt(file: PromptFile, slug: string): string {
  const where = file === "skill" ? `.claude/skills/${slug}/SKILL.md` : "AGENTS.md in the root of this project";
  return `Read ${where} first. Then build [describe what you want]. Follow every rule, run the Final checklist at the end and report anything that fails.`;
}
