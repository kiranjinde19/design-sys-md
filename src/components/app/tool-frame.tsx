"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImportProvider, useImport } from "./import-context";
import { TopBar } from "./top-bar";
import { toolVars } from "./tool-theme";
import { useToolTheme } from "./use-tool-theme";
import "./tool.css";

/** After an import from anywhere but the Export screen (which shows the result in its own card): the same feedback. */
function ImportBanner() {
  const { status, dismiss } = useImport();
  const onExport = usePathname() === "/app/export";
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-[1440px] px-4 md:px-6 xl:px-8 empty:hidden">
      {status && !onExport ? (
        <div
          className={cn(
            "mt-4 flex items-start justify-between gap-3 rounded-[10px] p-3 text-sm leading-5",
            status.ok ? "bg-[var(--t-success-50)] text-[var(--t-success-700)]" : "bg-[var(--t-error-50)] text-[var(--t-error-700)]",
          )}
        >
          <p className="min-w-0 [overflow-wrap:anywhere]">
            <span className="font-medium">{status.fileName}.</span> {status.text}
          </p>
          <button type="button" onClick={dismiss} aria-label="Dismiss" className="tool-link inline-flex size-5 shrink-0 items-center justify-center rounded-[5px]">
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** The frame every /app page shares: the fixed monochrome theme, the top bar and the import feedback. */
export function ToolFrame({ children }: { children: ReactNode }) {
  const { dark, toggle } = useToolTheme();
  // The page is drawn light on the server and switches to the saved theme right after it loads. Transitions stay off until
  // the first frames have passed (`data-ready`), so the colors do not animate through that switch.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className={cn("tool min-h-screen bg-background text-foreground", dark && "dark")} style={toolVars(dark)} data-ready={ready ? "true" : undefined}>
      <ImportProvider>
        <TopBar dark={dark} onToggleTheme={toggle} />
        <ImportBanner />
        {children}
      </ImportProvider>
    </div>
  );
}
