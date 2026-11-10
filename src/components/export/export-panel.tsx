"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/debug/section";
import {
  STACK_IDS,
  STACK_LABELS,
  generateSkillFile,
  parseSkillFile,
  useDesignSystem,
  type StackId,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { MarkdownView } from "./markdown-view";

/** Codex stops reading instruction files once they add up to this many bytes (its default). */
const CODEX_LIMIT_BYTES = 32 * 1024;

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (id: T) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((option) => (
          <Button key={option.id} size="sm" variant={option.id === value ? "default" : "outline"} onClick={() => onChange(option.id)}>
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function ExportPanel() {
  const { settings, tokens, update, importSettings } = useDesignSystem();
  const { project } = settings;
  const [file, setFile] = useState<"skill" | "agents">("skill");
  const [view, setView] = useState<"rendered" | "raw">("rendered");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const generated = useMemo(() => generateSkillFile({ settings, tokens }), [settings, tokens]);
  const text = file === "skill" ? generated.skill : generated.agents;
  const kib = generated.agentsBytes / 1024;
  const overLimit = generated.agentsBytes > CODEX_LIMIT_BYTES;
  const slug = generated.skill.match(/^name: (.+)$/m)?.[1] ?? "design-system";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ ok: true, text: `Copied ${file === "skill" ? "SKILL.md" : "AGENTS.md"} to the clipboard.` });
    } catch {
      setMessage({ ok: false, text: "Copying was blocked by the browser. Use Download instead." });
    }
  };

  const onImport = async (selected: File | undefined) => {
    if (!selected) return;
    const result = parseSkillFile(await selected.text());
    if (result.ok) {
      importSettings(result.settings);
      setMessage({ ok: true, text: `Restored the design system from ${selected.name}.` });
    } else {
      setMessage({ ok: false, text: result.error });
    }
    if (importRef.current) importRef.current.value = "";
  };

  return (
    <div className="space-y-10">
      <Section
        title="Your product"
        description="These appear in the file header and in its description, which tells an AI when to use the file."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Product name</span>
            <input
              type="text"
              value={project.name}
              maxLength={60}
              placeholder="e.g. Acme Billing"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              onChange={(event) => update({ project: { name: event.target.value } })}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">One line about the product</span>
            <input
              type="text"
              value={project.description}
              maxLength={200}
              placeholder="e.g. Billing software for small teams."
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              onChange={(event) => update({ project: { description: event.target.value } })}
            />
          </label>
        </div>
        <Segmented<StackId>
          label="Stack the file is written for"
          value={project.stack}
          options={STACK_IDS.map((id) => ({ id, label: STACK_LABELS[id] }))}
          onChange={(stack) => update({ project: { stack } })}
        />
      </Section>

      <Section title="Preview and download" description={`${generated.lines} lines. AGENTS.md is ${kib.toFixed(1)} KiB.`}>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <Segmented<"skill" | "agents">
            label="File"
            value={file}
            options={[
              { id: "skill", label: "SKILL.md (with frontmatter)" },
              { id: "agents", label: "AGENTS.md" },
            ]}
            onChange={setFile}
          />
          <Segmented<"rendered" | "raw"> label="View" value={view} options={[{ id: "rendered", label: "Rendered" }, { id: "raw", label: "Raw" }]} onChange={setView} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => download("SKILL.md", generated.skill)}>Download SKILL.md</Button>
          <Button variant="outline" onClick={() => download("AGENTS.md", generated.agents)}>
            Download AGENTS.md
          </Button>
          <Button variant="outline" onClick={copy}>
            Copy {file === "skill" ? "SKILL.md" : "AGENTS.md"}
          </Button>
        </div>

        <div
          role="status"
          className={cn("rounded-lg border p-3 text-sm", overLimit ? "border-destructive text-destructive" : "border-border text-muted-foreground")}
        >
          AGENTS.md is {kib.toFixed(1)} KiB of the 32 KiB Codex reads by default.
          {overLimit
            ? " It is over the limit, so Codex would cut it off. Raise project_doc_max_bytes in ~/.codex/config.toml, or remove the secondary color and unused options."
            : " It fits."}
        </div>

        {message ? (
          <p role="status" className={cn("text-sm", message.ok ? "text-foreground" : "text-destructive")}>
            {message.text}
          </p>
        ) : null}

        <div className="max-h-[70vh] overflow-auto rounded-xl border border-border p-4">
          {view === "rendered" ? (
            <MarkdownView source={text} />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{text}</pre>
          )}
        </div>
      </Section>

      <Section title="How to install this file" description="Both tools read plain files. There is nothing to run.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <h3 className="font-semibold">Claude Code: SKILL.md</h3>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                In your project, create the folder <code className="rounded bg-muted px-1 font-mono text-xs">.claude/skills/{slug}/</code>.
                To use it in every project, use <code className="rounded bg-muted px-1 font-mono text-xs">~/.claude/skills/{slug}/</code> instead.
              </li>
              <li>
                Save the downloaded file inside it as <code className="rounded bg-muted px-1 font-mono text-xs">SKILL.md</code>.
              </li>
              <li>
                Start Claude Code. It reads the description, and loads the skill by itself whenever you ask for UI work. You can also type{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">/{slug}</code>.
              </li>
            </ol>
          </div>
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <h3 className="font-semibold">Codex: AGENTS.md</h3>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Save the downloaded file as <code className="rounded bg-muted px-1 font-mono text-xs">AGENTS.md</code> in the root of your repository.
                For every project, use <code className="rounded bg-muted px-1 font-mono text-xs">~/.codex/AGENTS.md</code>.
              </li>
              <li>Codex reads it at the start of each session. It is plain Markdown, so there is no frontmatter.</li>
              <li>
                Codex reads at most 32 KiB of instructions by default. If you already have other AGENTS.md files, check the total, or raise{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">project_doc_max_bytes</code>.
              </li>
            </ol>
          </div>
        </div>
      </Section>

      <Section title="Import my previous file" description="Load a file you exported before, and keep editing. The data block at the end of the file restores every setting.">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={importRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            aria-label="Choose a SKILL.md or AGENTS.md file to import"
            className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm"
            onChange={(event) => void onImport(event.target.files?.[0])}
          />
        </div>
      </Section>

      <details className="rounded-xl border border-border p-4">
        <summary className="cursor-pointer text-sm font-medium">Raw tokens (JSON)</summary>
        <pre className="mt-3 max-h-96 overflow-auto font-mono text-xs">{JSON.stringify(tokens, null, 2)}</pre>
      </details>
    </div>
  );
}
