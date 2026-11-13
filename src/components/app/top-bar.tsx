"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Download, Moon, Sun, Upload } from "lucide-react";
import { useImport } from "./import-context";
import { MoreMenu } from "./more-menu";
import { Segmented } from "@/components/controls/controls";
import { PRESETS, PRESET_IDS, useDesignSystem, type PresetId } from "@/lib/design-system";

const BUTTON = "inline-flex h-10 items-center gap-2 rounded-[10px] border border-transparent px-4 text-base font-medium leading-6";

/** The top bar (56px minimum): logo and name left, the preset switch centered, Import file, the theme toggle and Export file (Back to editing on the Export screen) right. */
export function TopBar({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  const { presetId, applyPreset } = useDesignSystem();
  const { choose } = useImport();
  const onExport = usePathname() === "/app/export";
  // On phones the bar stays at the top while the page scrolls; the Roles tray sticks just under it, so it needs the bar's height.
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = bar.current;
    const root = header?.closest<HTMLElement>(".tool");
    if (!header || !root) return;
    const measure = () => root.style.setProperty("--topbar-h", `${header.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={bar} className="z-40 border-b border-border bg-background max-md:sticky max-md:top-0">
      {/* The inner container has the same max width and side padding as the page, so the logo lines up with the title and Export with the progress bar. */}
      <div className="mx-auto flex min-h-14 max-w-[1440px] flex-wrap items-center justify-between gap-x-2 gap-y-2 px-4 py-2 md:px-6 xl:gap-x-4 xl:px-8">
        {/* The mark and the name are one link to the tool. Below 480px the name is hidden but stays the link's accessible name. */}
        <Link href="/app" className="flex items-center gap-3 rounded-[10px]">
          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-[var(--card-border)] bg-card text-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="4" rx="1" />
              <rect x="4" y="10" width="10" height="4" rx="1" />
              <rect x="4" y="16" width="13" height="4" rx="1" />
            </svg>
          </span>
          <span className="text-base font-semibold leading-6 max-[480px]:sr-only">Design Sys.md</span>
        </Link>

        {/* 768 and up: the preset switch, Import and the theme toggle sit in the bar. Below 768 they move into the More menu. */}
        <div className="hidden md:block">
          <Segmented<PresetId> label="Preset" options={PRESET_IDS} value={presetId} onChange={applyPreset} labelFor={(id) => PRESETS[id].name} />
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 md:flex xl:gap-2">
            <button type="button" onClick={choose} className={`${BUTTON} tool-link md:px-2 xl:px-4`}>
              <Upload aria-hidden className="size-4" />
              Import file
            </button>
            <button type="button" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={onToggleTheme} className="tool-btn tool-btn--secondary size-10">
              {dark ? <Moon aria-hidden className="size-4" /> : <Sun aria-hidden className="size-4" />}
            </button>
          </div>
          {onExport ? (
            <Link href="/app" className={`${BUTTON} tool-btn tool-btn--secondary max-md:h-11`}>
              <ChevronLeft aria-hidden className="size-4" />
              Back to editing
            </Link>
          ) : (
            <Link href="/app/export" className={`${BUTTON} tool-btn tool-btn--primary max-md:h-11`}>
              <Download aria-hidden className="size-4" />
              Export file
            </Link>
          )}
          <div className="md:hidden">
            <MoreMenu dark={dark} onToggleTheme={onToggleTheme} />
          </div>
        </div>
      </div>
    </header>
  );
}
