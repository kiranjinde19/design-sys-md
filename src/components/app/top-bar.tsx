"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Download, Moon, Sun, Upload } from "lucide-react";
import { useImport } from "./import-context";
import { Segmented } from "@/components/controls/controls";
import { PRESETS, PRESET_IDS, useDesignSystem, type PresetId } from "@/lib/design-system";

const BUTTON = "inline-flex h-10 items-center gap-2 rounded-[10px] border border-transparent px-4 text-base font-medium leading-6";

/** The top bar (56px minimum): logo and name left, the preset switch centered, Import file, the theme toggle and Export file (Back to editing on the Export screen) right. */
export function TopBar({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  const { presetId, applyPreset } = useDesignSystem();
  const { choose } = useImport();
  const onExport = usePathname() === "/app/export";

  return (
    <header className="border-b border-border bg-background">
      {/* The inner container has the same max width and side padding as the page, so the logo lines up with the title and Export with the progress bar. */}
      <div className="mx-auto flex min-h-14 max-w-[1440px] flex-wrap items-center justify-between gap-4 px-8 py-2">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-8 items-center justify-center rounded-[10px] border border-[var(--card-border)] bg-card text-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="4" rx="1" />
            <rect x="4" y="10" width="10" height="4" rx="1" />
            <rect x="4" y="16" width="13" height="4" rx="1" />
          </svg>
        </span>
        <span className="text-base font-semibold leading-6">Design Sys.md</span>
      </div>

      <Segmented<PresetId> label="Preset" options={PRESET_IDS} value={presetId} onChange={applyPreset} labelFor={(id) => PRESETS[id].name} />

      <div className="flex items-center gap-2">
        <button type="button" onClick={choose} className={`${BUTTON} tool-link`}>
          <Upload aria-hidden className="size-4" />
          Import file
        </button>
        <button type="button" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={onToggleTheme} className="tool-btn tool-btn--secondary size-10">
          {dark ? <Moon aria-hidden className="size-4" /> : <Sun aria-hidden className="size-4" />}
        </button>
        {onExport ? (
          <Link href="/app" className={`${BUTTON} tool-btn tool-btn--secondary`}>
            <ChevronLeft aria-hidden className="size-4" />
            Back to editing
          </Link>
        ) : (
          <Link href="/app/export" className={`${BUTTON} tool-btn tool-btn--primary`}>
            <Download aria-hidden className="size-4" />
            Export file
          </Link>
        )}
      </div>
      </div>
    </header>
  );
}
