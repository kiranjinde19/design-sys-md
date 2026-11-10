/**
 * The skill file generator. One design system object in, one markdown file out.
 *
 * Order of the file: frontmatter, hard rules, tokens, components, signature details,
 * tone of voice, accessibility, do and don't, final checklist, data block.
 */

import type { DesignSystem } from "../types";
import { accessibilitySection } from "./accessibility";
import { checklistSection } from "./checklist";
import { componentsSection } from "./components";
import { createContext, type SkillOptions } from "./context";
import { dataBlock } from "./data-block";
import { dosAndDontsSection } from "./dos";
import { frontmatter, header } from "./frontmatter";
import { signatureSection } from "./signature";
import { tokensSection } from "./tokens";
import { voiceSection } from "./voice";

export type { SkillOptions };

export interface GeneratedFile {
  /** SKILL.md: with frontmatter. */
  skill: string;
  /** AGENTS.md: the same content without frontmatter. */
  agents: string;
  lines: number;
  /** Size of AGENTS.md in bytes. Codex reads at most 32 KiB of instructions by default. */
  agentsBytes: number;
}

const bytesOf = (text: string) => new TextEncoder().encode(text).length;

export function generateSkillFile(ds: DesignSystem, options?: Partial<SkillOptions>): GeneratedFile {
  const { project } = ds.settings;
  const ctx = createContext(ds, {
    stack: options?.stack ?? project.stack,
    name: options?.name ?? project.name,
    description: options?.description ?? project.description,
  });

  const body = [
    ...header(ctx),
    ...tokensSection(ctx),
    ...componentsSection(ctx),
    ...signatureSection(ctx),
    ...voiceSection(ctx),
    ...accessibilitySection(ctx),
    ...dosAndDontsSection(ctx),
    ...checklistSection(ctx),
    ...dataBlock(ds.settings),
  ];

  const agents = body.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
  const skill = frontmatter(ctx).join("\n") + agents;
  return { skill, agents, lines: skill.split("\n").length, agentsBytes: bytesOf(agents) };
}
