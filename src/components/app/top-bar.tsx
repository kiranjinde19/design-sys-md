"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PRESETS, PRESET_IDS, useDesignSystem } from "@/lib/design-system";
import { cn } from "@/lib/utils";

/** 56px bar: logo and name, preset switch, Import file, light and dark switch, and the one primary button. */
export function TopBar({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  const { presetId, isModified, applyPreset, reset } = useDesignSystem();

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-8">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          D
        </span>
        <span className="text-sm font-semibold">Design Sys.md</span>
      </div>

      <div className="ml-6 flex items-center gap-2">
        <div role="group" aria-label="Starting preset" className="flex rounded-lg border border-border p-0.5">
          {PRESET_IDS.map((id) => (
            <Button
              key={id}
              size="sm"
              variant={id === presetId ? "secondary" : "ghost"}
              aria-pressed={id === presetId}
              className="h-7 rounded-md px-3"
              onClick={() => applyPreset(id)}
            >
              {PRESETS[id].name}
            </Button>
          ))}
        </div>
        {isModified ? (
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={reset}>
            Reset to {PRESETS[presetId].name}
          </Button>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Import and Export live on /debug until their own screens are built. */}
        <Link href="/debug#export" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-9 px-3")}>
          Import file
        </Link>
        <Button variant="ghost" size="icon-lg" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={onToggleTheme}>
          {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
        </Button>
        <Link href="/debug#export" className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-9 px-4")}>
          Export file
        </Link>
      </div>
    </header>
  );
}
