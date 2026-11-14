"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toolVars } from "@/components/app/tool-theme";
import { cn } from "@/lib/utils";
import { MarkdownView } from "./markdown-view";

const VIEWS = [
  { id: "rendered", label: "Rendered" },
  { id: "raw", label: "Raw" },
] as const;
type ViewId = (typeof VIEWS)[number]["id"];

/** A phone shows about one screen of the file (this share of the window height) before "Show the whole file". */
const COLLAPSED_SHARE = 0.7;

/** True below 768px, where the file card does not scroll inside itself and starts collapsed. */
function usePhone(): boolean {
  return useSyncExternalStore(
    (listener) => {
      const query = window.matchMedia("(max-width: 767px)");
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

/**
 * The right column: the file as a document (Rendered) or as plain text (Raw), with a header line, a "What is inside" chip
 * row and a scroll area with a bottom fade. The rendered document sits on a white sheet in both light and dark mode.
 * The card is as tall as the left column (it fills its box), and both views scroll inside it.
 */
export function FilePreview({
  text,
  fileName,
  lines,
  size,
  sections,
}: {
  text: string;
  fileName: string;
  lines: number;
  size: string;
  sections: string[];
}) {
  const [view, setView] = useState<ViewId>("rendered");
  // Below 768px a view taller than about one screen (70vh) starts clipped with a fade; a real button shows the whole file (and hides it again).
  const phone = usePhone();
  const [expanded, setExpanded] = useState(false);
  const [tall, setTall] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const needsCollapse = phone && tall;
  const collapsed = needsCollapse && !expanded;
  const shown = text;
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // Measure the real height of the open view (it changes with the view, the width and the text), not the clipped box.
  useEffect(() => {
    const node = content.current;
    if (!phone || !node) return;
    const measure = () =>
      setTall(node.offsetHeight > window.innerHeight * COLLAPSED_SHARE);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [phone, view, text]);

  // Real tab semantics: one tab stop, the arrow keys, Home and End move between the tabs.
  const onKeyDown = (event: KeyboardEvent) => {
    const index = VIEWS.findIndex((v) => v.id === view);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % VIEWS.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + VIEWS.length) % VIEWS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = VIEWS.length - 1;
    else return;
    event.preventDefault();
    setView(VIEWS[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <section
      aria-label="File preview"
      className="relative h-[70vh] max-h-[720px] min-h-[420px] w-full min-w-0 max-md:h-auto max-md:max-h-none max-md:min-h-0 xl:h-auto xl:max-h-none xl:min-h-[560px] xl:flex-[1_1_560px]"
    >
      <div className="tool-panel absolute inset-0 flex min-w-0 flex-col overflow-hidden max-md:static max-md:overflow-visible">
        <div className="flex shrink-0 flex-wrap items-end gap-x-1 border-b border-border px-4 pt-2">
          <div
            role="tablist"
            aria-label="File view"
            onKeyDown={onKeyDown}
            className="flex gap-1"
          >
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
                  view === v.id
                    ? "border-[var(--t-brand-600)] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <span
            className="ml-auto self-center py-1 text-sm leading-5 text-muted-foreground"
            data-file-info
          >
            {fileName}, {lines} lines, {size}
          </span>
        </div>

        <div
          className="tool-tabs flex shrink-0 items-center gap-2 overflow-x-auto border-b border-border px-4 py-3 md:flex-wrap md:px-6"
          aria-label="What is inside"
        >
          <span className="shrink-0 text-xs leading-4 whitespace-nowrap text-muted-foreground">
            What is inside
          </span>
          {sections.map((section) => (
            <span
              key={section}
              className="shrink-0 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-medium leading-4 text-muted-foreground"
            >
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
            className={cn(
              "export-scroll absolute inset-0 overflow-y-auto overflow-x-hidden max-md:static max-md:overflow-visible",
              collapsed && "max-md:max-h-[70vh] max-md:overflow-hidden",
            )}
          >
            <div ref={content}>
              {view === "rendered" ? (
                <div
                  className="export-sheet text-foreground [overflow-wrap:anywhere]"
                  style={{
                    ...toolVars(false),
                    background: "var(--background)",
                    color: "var(--foreground)",
                  }}
                >
                  <MarkdownView source={shown} />
                  {/* Room for the fade at the end of the scroll, so it never covers the last lines. */}
                  <span aria-hidden className="block h-20 max-md:hidden" />
                  {/* The fade lives inside the sheet (sticky at the bottom of the scroll area), so it is exactly as wide as the sheet and fades to the sheet's own white. */}
                  <span aria-hidden className="export-fade max-md:hidden" />
                </div>
              ) : (
                <div>
                  <pre className="whitespace-pre-wrap break-words p-6 pb-24 font-mono text-sm leading-5 [overflow-wrap:anywhere]">
                    {shown}
                  </pre>
                  <span aria-hidden className="export-fade max-md:hidden" />
                </div>
              )}
            </div>
          </div>
          {/* The fade is drawn in the surface's own colors: the white sheet when Rendered, the card when Raw. */}
          {collapsed ? (
            <span
              aria-hidden
              className="export-collapse"
              style={view === "rendered" ? { ...toolVars(false) } : undefined}
            />
          ) : null}
        </div>

        {/* Phones only: the whole file is long, so it starts collapsed. The same button stays in place, so focus is kept. */}
        {needsCollapse ? (
          <div className="flex flex-col gap-2 border-t border-border p-4">
            <p
              className="text-sm leading-5 text-muted-foreground"
              data-collapse-note
            >
              {expanded
                ? `Showing all ${lines} lines.`
                : `Showing the first screen of ${lines} lines.`}
            </p>
            <button
              ref={toggle}
              type="button"
              aria-expanded={expanded}
              aria-controls={`${id}-panel`}
              onClick={() => {
                setExpanded((value) => !value);
                // Collapsing moves the button up the page; keep it in view.
                requestAnimationFrame(() =>
                  toggle.current?.scrollIntoView({ block: "nearest" }),
                );
              }}
              className="tool-btn tool-btn--secondary inline-flex h-11 items-center justify-center gap-2 px-4 text-base font-medium leading-6"
            >
              {expanded ? (
                <ChevronUp aria-hidden className="size-4" />
              ) : (
                <ChevronDown aria-hidden className="size-4" />
              )}
              {expanded ? "Show less" : "Show the whole file"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
