"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { DEMO_DEFAULT, type DemoInput } from "./demo-constants";
import type { DemoView } from "./demo-engine";

/** The same saved choice the tool uses ("light" or "dark"), so the mode carries over between the two. */
const THEME_KEY = "design-sys-md:tool-theme";
const themeListeners = new Set<() => void>();

function readTheme(): "light" | "dark" | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

interface LandingContextValue {
  input: DemoInput;
  setInput: (patch: Partial<DemoInput>) => void;
  /** What the demo shows for the current input. Comes from the app's real engine. */
  view: DemoView;
  /** True once the real engine has been loaded in the browser (until then the page shows the server's first result). */
  engineReady: boolean;
  toggleTheme: () => void;
}

const LandingContext = createContext<LandingContextValue | null>(null);

export function useLanding(): LandingContextValue {
  const value = useContext(LandingContext);
  if (!value) throw new Error("useLanding must be used inside LandingShell");
  return value;
}

type Engine = typeof import("./demo-engine");

/**
 * The page frame: light and dark mode, and the one piece of state the demo and "Three steps" share (the visitor's color,
 * corners and type). The first result comes from the server; the real engine is then loaded in the browser, and every
 * change after that is computed by it (token engine, contrast math and SKILL.md generator).
 */
export function LandingShell({ initial, children }: { initial: DemoView; children: ReactNode }) {
  const theme = useSyncExternalStore(
    (listener) => {
      themeListeners.add(listener);
      return () => themeListeners.delete(listener);
    },
    readTheme,
    () => null,
  );
  // Keep <html> in step with the choice (the page's CSS reads it there; the head script set it before the first paint).
  useEffect(() => {
    const root = document.documentElement;
    if (theme) {
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
    } else {
      delete root.dataset.theme;
      root.style.removeProperty("color-scheme");
    }
  }, [theme]);
  const toggleTheme = useCallback(() => {
    const effective = readTheme() ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    try {
      window.localStorage.setItem(THEME_KEY, effective === "dark" ? "light" : "dark");
    } catch {
      // Storage blocked: the switch works until the page reloads.
    }
    themeListeners.forEach((listener) => listener());
  }, []);

  const [input, setInputState] = useState<DemoInput>(DEMO_DEFAULT);
  const setInput = useCallback((patch: Partial<DemoInput>) => setInputState((current) => ({ ...current, ...patch })), []);

  const [engine, setEngine] = useState<Engine | null>(null);
  useEffect(() => {
    let cancelled = false;
    import("./demo-engine").then((loaded) => {
      if (!cancelled) setEngine(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const view = useMemo(() => (engine ? engine.computeDemo(input) : initial), [engine, input, initial]);
  const value = useMemo(() => ({ input, setInput, view, engineReady: engine !== null, toggleTheme }), [input, setInput, view, engine, toggleTheme]);

  return (
    <LandingContext.Provider value={value}>
      <div className="pl" data-theme={theme ?? undefined} data-engine={engine ? "ready" : "loading"} style={{ ["--brand" as string]: view.brand }}>
        {children}
      </div>
    </LandingContext.Provider>
  );
}
