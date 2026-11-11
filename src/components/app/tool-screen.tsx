"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PRESETS, SYSTEMS, useDesignSystem, type SystemId } from "@/lib/design-system";
import { useSelectedFonts } from "@/components/typography/google-fonts";
import { cn } from "@/lib/utils";
import { Board } from "./board";
import { Editor } from "./editor";
import { Preview } from "./preview";
import { TopBar } from "./top-bar";
import { toolVars } from "./tool-theme";
import { useToolTheme } from "./use-tool-theme";
import "./tool.css";

/** The tool's own screen. It wears the fixed SaaS Clean theme; the user's choices only appear inside the samples and the preview. */
export function ToolScreen() {
  const { ready, reviewed, presetId, isModified, reset } = useDesignSystem();
  const { dark, toggle } = useToolTheme();
  const [openId, setOpenId] = useState<SystemId | null>(null);
  // Load only the fonts currently selected, so the samples and the preview show the real fonts.
  useSelectedFonts();

  return (
    <div className={cn("tool min-h-screen bg-background text-foreground", dark && "dark")} style={toolVars(dark)}>
      <TopBar dark={dark} onToggleTheme={toggle} />

      <main className="mx-auto max-w-[1440px] px-8 pb-12 pt-6">
        <div className="mb-5 flex items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your design system</h1>
            <p className="mt-1 text-sm text-muted-foreground">Open a tile to edit it. The preview updates as you go.</p>
          </div>
          <div className="flex flex-col items-end" role="status">
            <div className="flex items-center gap-3 text-sm">
              {isModified ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  {PRESETS[presetId].name}, edited.
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={reset}>
                    Reset
                  </Button>
                </span>
              ) : null}
              <span className="font-medium">
                {reviewed.length} of {SYSTEMS.length} reviewed
              </span>
            </div>
            <div className="mt-2 flex gap-1" aria-hidden>
              {SYSTEMS.map((system) => (
                <span key={system.id} className={cn("h-1.5 w-6 rounded-full", reviewed.includes(system.id) ? "bg-primary" : "bg-border")} />
              ))}
            </div>
          </div>
        </div>

        {ready ? (
          <div className="grid gap-6 min-[1280px]:grid-cols-[auto_minmax(0,1fr)]">
            <div>{openId ? <Editor openId={openId} onOpen={setOpenId} onClose={() => setOpenId(null)} /> : <Board onOpen={setOpenId} />}</div>
            <Preview />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading your saved work…</p>
        )}
      </main>
    </div>
  );
}
