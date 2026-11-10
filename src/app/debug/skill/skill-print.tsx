import Link from "next/link";
import { createDesignSystem } from "@/lib/design-system/generate";
import { PRESETS } from "@/lib/design-system/presets";
import { generateSkillFile } from "@/lib/design-system/skill/generate";
import { STACK_LABELS } from "@/lib/design-system/skill/context";
import { STACK_IDS, type StackId } from "@/lib/design-system/types";

const SAMPLE_NAME = "Sample Product";
const SAMPLE_DESCRIPTION = "A SaaS product built with an AI coding tool.";

/** Prints the complete SKILL.md for the SaaS Clean preset, generated at build time. */
export function SkillPrint({ stack }: { stack: StackId }) {
  const ds = createDesignSystem(PRESETS["saas-clean"].settings);
  const file = generateSkillFile(ds, { stack, name: SAMPLE_NAME, description: SAMPLE_DESCRIPTION });

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
          {file.lines} lines. AGENTS.md (the same without frontmatter) is {(file.agentsBytes / 1024).toFixed(1)} KiB of the 32 KiB Codex reads by default. Sample
          product name and description are placeholders.
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
