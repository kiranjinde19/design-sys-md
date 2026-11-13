"use client";

import { useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Segmented } from "@/components/controls/controls";
import { useImport } from "@/components/app/import-context";
import { STACK_IDS, fileSections, generateSkillFile, kib, useDesignSystem, type StackId } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { FilePreview } from "./file-preview";
import { InstallSteps } from "./install-steps";
import { SizeMeter } from "./size-meter";

const STACKS: Record<StackId, { label: string; help: string; recommended?: boolean }> = {
  "next-tailwind-shadcn": { label: "Next.js, Tailwind CSS and shadcn/ui", help: "Tokens in globals.css, shadcn role names, component recipes with Tailwind classes.", recommended: true },
  "react-tailwind": { label: "React and Tailwind CSS", help: "Plain React components, no shadcn." },
  "html-css": { label: "Plain HTML and CSS", help: "CSS variables and class names, no framework." },
};

const FILES = { skill: { name: "SKILL.md", label: "SKILL.md, Claude Code" }, agents: { name: "AGENTS.md", label: "AGENTS.md, Codex" } } as const;
type FileId = keyof typeof FILES;

const BUTTON = "inline-flex h-10 items-center gap-2 rounded-[10px] border border-transparent px-4 text-base font-medium leading-6";
const INPUT = "h-10 w-full rounded-[10px] border border-input bg-background px-3 text-base leading-6 placeholder:text-muted-foreground";

const Card = ({ label, children, className, ...rest }: { label: string; children: ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) => (
  <section aria-label={label} className={cn("tool-panel flex flex-col gap-4 p-4 md:p-6", className)} {...rest}>
    {children}
  </section>
);
const CardTitle = ({ title, text }: { title: string; text?: string }) => (
  <div>
    <h2 className="text-xl font-semibold leading-7 tracking-[-0.005em]">{title}</h2>
    {text ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p> : null}
  </div>
);

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

/** The Export view: the product, the download, the import, the file preview and the install steps. */
export function ExportScreen() {
  const { ready, settings, tokens, presetId, update } = useDesignSystem();
  const { status, choose, importFile } = useImport();
  const { project } = settings;
  const [file, setFile] = useState<FileId>("skill");
  const [copied, setCopied] = useState<{ ok: boolean; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragging, setDragging] = useState(false);

  const generated = useMemo(() => generateSkillFile({ settings, tokens }, { presetId }), [settings, tokens, presetId]);
  const text = file === "skill" ? generated.skill : generated.agents;
  const bytes = new TextEncoder().encode(text).length;
  // Both sizes come from the real generated files for the chosen stack and product.
  const skillBytes = useMemo(() => new TextEncoder().encode(generated.skill).length, [generated.skill]);
  const lines = text.split("\n").length;
  const sections = useMemo(() => fileSections(text), [text]);
  const fileName = FILES[file].name;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ok: true, text: `Copied ${fileName} to the clipboard.` });
    } catch {
      setCopied({ ok: false, text: "Copying was blocked by the browser. Use Download instead." });
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 2500);
  };

  const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes("Files");

  if (!ready) {
    return (
      <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 xl:px-8 xl:py-8">
        <p className="text-sm text-muted-foreground">Loading your saved work…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-6 xl:px-8 xl:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.02em]">Export your design system</h1>
        <p className="text-base leading-6 text-muted-foreground">One file your AI reads before it builds anything. Check it, then download.</p>
      </div>

      <div className="flex flex-col items-stretch gap-6 xl:flex-row">
        <div className="flex w-full min-w-0 flex-col gap-4 xl:flex-[0_1_480px]">
          <Card label="Your product">
            <CardTitle title="Your product" text="These appear in the file header and tell an AI when to use it." />
            <div className="flex flex-col gap-1">
              <label htmlFor="product-name" className="text-sm font-medium leading-5">
                Product name
              </label>
              <input id="product-name" type="text" value={project.name} maxLength={60} placeholder="Acme Billing" className={INPUT} onChange={(event) => update({ project: { name: event.target.value } })} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="product-line" className="text-sm font-medium leading-5">
                One line about the product
              </label>
              <input
                id="product-line"
                type="text"
                value={project.description}
                maxLength={200}
                placeholder="Billing software for small teams."
                aria-describedby="product-line-help"
                className={INPUT}
                onChange={(event) => update({ project: { description: event.target.value } })}
              />
              <p id="product-line-help" className="text-sm leading-5 text-muted-foreground">
                Optional. If you leave it empty, it is left out of the file.
              </p>
            </div>
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-2 p-0 text-sm font-medium leading-5">Stack the file is written for</legend>
              {STACK_IDS.map((id) => (
                <label
                  key={id}
                  className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-border p-3 has-[:checked]:border-2 has-[:checked]:border-foreground has-[:checked]:p-[11px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ring)]"
                >
                  <input type="radio" name="stack" value={id} checked={project.stack === id} onChange={() => update({ project: { stack: id } })} className="mt-1 size-4 accent-[var(--foreground)]" />
                  <span className="flex flex-1 flex-col">
                    <span className="flex items-center gap-2 text-sm font-medium leading-5">
                      {STACKS[id].label}
                      {STACKS[id].recommended ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium leading-4 text-muted-foreground">Recommended</span> : null}
                    </span>
                    <span className="text-xs leading-4 text-muted-foreground">{STACKS[id].help}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </Card>

          <Card label="Download">
            <CardTitle title="Download" />
            <div className="flex">
              <Segmented<FileId> label="File" options={["skill", "agents"]} value={file} onChange={setFile} labelFor={(id) => FILES[id].label} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => download(fileName, text)} className={`${BUTTON} tool-btn tool-btn--primary`}>
                <Download aria-hidden className="size-4" />
                Download {fileName}
              </button>
              <button type="button" onClick={copy} className={`${BUTTON} tool-btn tool-btn--secondary`}>
                {copied?.ok ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
                {copied?.ok ? "Copied" : "Copy file"}
              </button>
            </div>
            <p role="status" aria-live="polite" className={cn("text-sm leading-5 empty:hidden", copied && !copied.ok ? "text-[var(--t-error-700)]" : "text-muted-foreground")}>
              {copied?.text}
            </p>
            <p className="text-sm leading-5" data-skill-size>
              <span className="font-medium">SKILL.md</span> <span className="tabular-nums">{kib(skillBytes)} KiB</span>. Claude Code has no hard size limit for skills. Shorter files work better.
            </p>
            <SizeMeter bytes={generated.agentsBytes} />
          </Card>

          <Card
            label="Import a previous file"
            className={cn("relative gap-3", dragging && "outline-2 outline-dashed outline-offset-2 outline-[var(--foreground)]")}
            onDragEnter={(event) => {
              if (hasFiles(event)) {
                event.preventDefault();
                setDragging(true);
              }
            }}
            onDragOver={(event) => {
              if (hasFiles(event)) {
                event.preventDefault();
                setDragging(true);
              }
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
            }}
            onDrop={(event) => {
              if (!hasFiles(event)) return;
              event.preventDefault();
              setDragging(false);
              void importFile(event.dataTransfer.files[0]);
            }}
          >
            <CardTitle title="Import a previous file" text="Load a file you exported before and keep editing. Any .md file from this tool works. You can also drop a file on this card." />
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={choose} className={`${BUTTON} tool-btn tool-btn--secondary`}>
                Choose file
              </button>
              <span className="min-w-0 text-sm leading-5 [overflow-wrap:anywhere] text-muted-foreground" data-import-file>
                {dragging ? "Drop the file to import it" : (status?.fileName ?? "SKILL.md, AGENTS.md or a renamed copy")}
              </span>
            </div>
            <div role="status" aria-live="polite" className="empty:hidden">
              {status ? (
                <p className={cn("flex items-start gap-2 rounded-[10px] p-3 text-sm font-medium leading-5", status.ok ? "bg-[var(--t-success-50)] text-[var(--t-success-700)]" : "bg-[var(--t-error-50)] text-[var(--t-error-700)]")}>
                  <span aria-hidden className="mt-0.5 shrink-0">
                    {status.ok ? "✓" : "!"}
                  </span>
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    <span className="sr-only">{status.ok ? "Imported " : "Could not import "}</span>
                    {status.text}
                  </span>
                </p>
              ) : null}
            </div>
          </Card>
        </div>

        <FilePreview text={text} fileName={fileName} lines={lines} size={`${kib(bytes)} KiB`} sections={sections} />
      </div>

      <InstallSteps slug={generated.slug} stack={project.stack} />

      <details className="tool-panel p-4">
        <summary className="cursor-pointer text-sm font-medium">Advanced: raw tokens (JSON)</summary>
        <pre className="mt-3 max-h-96 overflow-auto font-mono text-xs">{JSON.stringify(tokens, null, 2)}</pre>
      </details>
    </main>
  );
}
