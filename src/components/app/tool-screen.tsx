"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
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

      <main className={cn("mx-auto flex max-w-[1440px] flex-col px-8 py-8", openId ? "gap-4" : "gap-6")}>
        {openId ? (
          <button type="button" onClick={() => setOpenId(null)} className="tool-link inline-flex items-center gap-1 self-start text-sm leading-5">
            <ChevronLeft aria-hidden className="size-4" />
            Back to board
          </button>
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.02em]">Your design system</h1>
              <p className="text-base leading-6 text-muted-foreground">Open a tile to edit it. The preview updates as you go.</p>
            </div>
            <div className="flex w-[200px] flex-col gap-2" role="status">
              {isModified ? (
                <span className="flex items-center gap-1 text-xs leading-4 text-muted-foreground">
                  {PRESETS[presetId].name}, edited.
                  <button type="button" onClick={reset} className="tool-link text-xs leading-4">
                    Reset
                  </button>
                </span>
              ) : null}
              <span className="text-sm font-medium leading-5">
                {reviewed.length} of {SYSTEMS.length} reviewed
              </span>
              <span aria-hidden className="block h-2 rounded-full bg-secondary">
                <span className="block h-2 rounded-full bg-primary" style={{ width: `${(reviewed.length / SYSTEMS.length) * 100}%` }} />
              </span>
            </div>
          </div>
        )}

        {ready ? (
          <div className="flex flex-wrap items-stretch gap-6">
            {openId ? <Editor openId={openId} onOpen={setOpenId} onClose={() => setOpenId(null)} /> : <Board onOpen={setOpenId} />}
            <Preview height={openId ? 810 : 648} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading your saved work…</p>
        )}
      </main>
    </div>
  );
}
