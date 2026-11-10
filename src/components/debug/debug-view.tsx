"use client";

import { useDesignSystem } from "@/lib/design-system";
import { DebugColors } from "./debug-colors";
import { DebugComponents } from "./debug-components";
import { DebugControls } from "./debug-controls";
import { DebugShape } from "./debug-shape";
import { DebugType } from "./debug-type";

export function DebugView() {
  const { ready, tokens } = useDesignSystem();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
      <header className="space-y-3">
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          This page is temporary. It exists only to test the token engine and will be removed before launch.
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Token engine debug</h1>
        <p className="text-muted-foreground">
          Change a control and every system below updates. Your changes autosave in this browser, so a refresh keeps them.
        </p>
      </header>

      {ready ? (
        <>
          <DebugControls />
          <DebugColors />
          <DebugType />
          <DebugShape />
          <DebugComponents />
          <details className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium">Raw tokens (JSON)</summary>
            <pre className="mt-3 max-h-96 overflow-auto font-mono text-xs">{JSON.stringify(tokens, null, 2)}</pre>
          </details>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Loading your saved work…</p>
      )}
    </main>
  );
}
