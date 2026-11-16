import Link from "next/link";
import { createDesignSystem } from "@/lib/design-system/generate";
import { applyPatch } from "@/lib/design-system/normalize";
import { PRESETS } from "@/lib/design-system/presets";
import { generateSkillFile } from "@/lib/design-system/skill/generate";
import { STACK_LABELS } from "@/lib/design-system/skill/context";
import { suggestSecondaryColors } from "@/lib/design-system/colors";
import { STACK_IDS, type StackId } from "@/lib/design-system/types";

const SAMPLE_NAME = "Sample Product";
const SAMPLE_DESCRIPTION = "A SaaS product built with an AI coding tool.";

/** Prints the complete SKILL.md for the SaaS Clean preset, generated at build time. */
export function SkillPrint({ stack }: { stack: StackId }) {
  const preset = PRESETS["saas-clean"].settings;
  const file = generateSkillFile(createDesignSystem(preset), { stack, name: SAMPLE_NAME, description: SAMPLE_DESCRIPTION, presetId: "saas-clean" });
  // The largest realistic case: a product name, a description and a secondary color all filled in.
  const full = applyPatch(preset, { colors: { secondary: suggestSecondaryColors(preset.colors.brand)[0].hex } });
  const fullFile = generateSkillFile(createDesignSystem(full), { stack, name: SAMPLE_NAME, description: SAMPLE_DESCRIPTION, presetId: "saas-clean" });
  const kib = (bytes: number) => (bytes / 1024).toFixed(1);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        This page is temporary. It prints the complete SKILL.md for the SaaS Clean preset so it can be reviewed from a link, and will be removed before launch.
      </p>
      <p className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-muted-foreground">
        Built from commit {process.env.NEXT_PUBLIC_BUILD_COMMIT} at {process.env.NEXT_PUBLIC_BUILD_TIME}. Every deploy rebuilds this page from the
        same generateSkillFile() the Export step uses.
      </p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">SKILL.md: SaaS Clean, {STACK_LABELS[stack]}</h1>
        <p className="text-sm text-muted-foreground">
          Shown with a sample name and description. SKILL.md is {file.lines} lines. AGENTS.md (the same without frontmatter) is {kib(file.agentsBytes)} KiB.
          With a secondary color added as well it is {kib(fullFile.agentsBytes)} KiB (limit Codex reads by default: 32 KiB; target: under 28 KiB).
        </p>
        <nav className="flex flex-wrap gap-3 text-sm" aria-label="Stack">
          {STACK_IDS.map((id) => (
            <Link key={id} href={id === "next-tailwind-shadcn" ? "/debug/skill" : `/debug/skill/${id}`} className={id === stack ? "font-semibold underline" : "underline"}>
              {STACK_LABELS[id]}
            </Link>
          ))}
        </nav>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border p-4 font-mono text-xs leading-relaxed">{file.skill}</pre>
    </main>
  );
}
