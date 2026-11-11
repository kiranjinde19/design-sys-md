"use client";

import { Check } from "lucide-react";
import { SYSTEMS, useDesignSystem, type SystemId } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { TileSample } from "./tile-samples";

/** How many columns and rows each tile covers on the 3 column board. */
const SPAN: Record<SystemId, string> = {
  colors: "col-span-2 row-span-2",
  typography: "row-span-2",
  radius: "",
  spacing: "",
  borders: "",
  shadows: "",
  buttons: "col-span-2",
  signature: "col-span-2",
  voice: "",
};

/** The bento board: 560px wide, 3 columns, 120px rows, 12px gaps. Every tile is a real button. */
export function Board({ onOpen }: { onOpen: (id: SystemId) => void }) {
  const { reviewed } = useDesignSystem();

  return (
    <div className="grid w-[560px] max-w-full grid-cols-3 gap-3" style={{ gridAutoRows: 120 }}>
      {SYSTEMS.map((system) => {
        const done = reviewed.includes(system.id);
        return (
          <button
            key={system.id}
            type="button"
            onClick={() => onOpen(system.id)}
            aria-label={`${system.label}${done ? ", reviewed" : ""}. Open the editor.`}
            className={cn("tool-tile tool-hover flex min-h-0 flex-col gap-2 overflow-hidden p-4 text-left", SPAN[system.id])}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{system.label}</span>
              {done ? (
                <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : null}
            </span>
            <span className="min-h-0 flex-1 overflow-hidden">
              <TileSample id={system.id} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
