"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { toolVars } from "@/components/app/tool-theme";
import { cn } from "@/lib/utils";
import { MarkdownView } from "./markdown-view";

const VIEWS = [
  { id: "rendered", label: "Rendered" },
  { id: "raw", label: "Raw" },
] as const;
type ViewId = (typeof VIEWS)[number]["id"];

/**
 * The right column: the file as a document (Rendered) or as plain text (Raw), with a header line, a "What is inside" chip
 * row and a scroll area with a bottom fade. The rendered document sits on a white sheet in both light and dark mode.
 * The card is as tall as the left column (it fills its box), and both views scroll inside it.
 */
export function FilePreview({ text, fileName, lines, size, sections }: { text: string; fileName: string; lines: number; size: string; sections: string[] }) {
  const [view, setView] = useState<ViewId>("rendered");
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // Real tab semantics: one tab stop, the arrow keys, Home and End move between the tabs.
  const onKeyDown = (event: KeyboardEvent) => {
    const index = VIEWS.findIndex((v) => v.id === view);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % VIEWS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + VIEWS.length) % VIEWS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = VIEWS.length - 1;
    else return;
    event.preventDefault();
    setView(VIEWS[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <section aria-label="File preview" className="relative min-h-[560px] min-w-0 flex-[1_1_560px]">
      <div className="tool-panel absolute inset-0 flex min-w-0 flex-col overflow-hidden">
        <div className="flex shrink-0 items-end gap-1 border-b border-border px-4 pt-2">
          <div role="tablist" aria-label="File view" onKeyDown={onKeyDown} className="flex gap-1">
            {VIEWS.map((v, index) => (
              <button
                key={v.id}
                ref={(el) => {
                  tabs.current[index] = el;
                }}
                id={`${id}-${v.id}`}
                role="tab"
                type="button"
                aria-selected={view === v.id}
                aria-controls={`${id}-panel`}
                tabIndex={view === v.id ? 0 : -1}
                onClick={() => setView(v.id)}
                className={cn(
                  "-mb-px h-10 border-b-2 px-3 text-sm font-medium leading-5",
                  view === v.id ? "border-[var(--t-brand-600)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <span className="ml-auto self-center text-sm leading-5 text-muted-foreground" data-file-info>
            {fileName}, {lines} lines, {size}
          </span>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-6 py-3" aria-label="What is inside">
          <span className="text-xs leading-4 text-muted-foreground">What is inside</span>
          {sections.map((section) => (
            <span key={section} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium leading-4 text-muted-foreground">
              {section}
            </span>
          ))}
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            role="tabpanel"
            id={`${id}-panel`}
            aria-labelledby={`${id}-${view}`}
            tabIndex={0}
            className="export-scroll absolute inset-0 overflow-y-auto overflow-x-hidden"
          >
            {view === "rendered" ? (
              <div className="export-sheet text-foreground" style={{ ...toolVars(false), background: "var(--background)", color: "var(--foreground)" }}>
                <MarkdownView source={text} />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words p-6 font-mono text-sm leading-5 [overflow-wrap:anywhere]">{text}</pre>
            )}
          </div>
          {/* A fade at the bottom says there is more to scroll. */}
          <span aria-hidden className="export-fade pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent" style={{ ["--tw-gradient-to" as string]: view === "rendered" ? "#FFFFFF" : "var(--background)" }} />
        </div>
      </div>
    </section>
  );
}
