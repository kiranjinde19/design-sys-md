"use client";

import Link from "next/link";
import { Download, Menu, Moon, Sun, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/controls/controls";
import { PRESETS, PRESET_IDS, useDesignSystem, type PresetId } from "@/lib/design-system";
import { cn } from "@/lib/utils";

/** 56px bar: logo and name, preset switch, Import file, light and dark switch, and the one primary button. */
export function TopBar({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  const { presetId, applyPreset } = useDesignSystem();

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-8">
      <div className="flex items-center gap-3">
        {/* 32px rounded square, brand-50 fill, 1px brand-100 border, three line mark */}
        <span aria-hidden className="flex size-8 items-center justify-center rounded-[10px] border border-[var(--card-border)] bg-card text-[var(--t-brand-600)]">
          <Menu className="size-4" strokeWidth={2} />
        </span>
        <span className="text-sm font-semibold">Design Sys.md</span>
      </div>

      <div className="ml-6">
        <Segmented<PresetId> label="Starting preset" options={PRESET_IDS} value={presetId} onChange={applyPreset} labelFor={(id) => PRESETS[id].name} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Import and Export live on /debug until their own screens are built. */}
        <Link href="/debug#export" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-10 gap-2 px-3")}>
          <Upload aria-hidden className="size-4" />
          Import file
        </Link>
        <Button variant="secondary" size="icon-lg" className="size-10" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={onToggleTheme}>
          {dark ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
        </Button>
        <Link href="/debug#export" className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-10 gap-2 px-4")}>
          <Download aria-hidden className="size-4" />
          Export file
        </Link>
      </div>
    </header>
  );
}
