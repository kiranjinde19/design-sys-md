"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/** Lets a preview tab tell the preview tile that part of it scrolls sideways (so the tile shows the hint). */
export const ScrollHintContext = createContext<{ hintId: string; report: (id: string, scrolls: boolean) => void } | null>(null);

let counter = 0;

/**
 * A part of a preview that is wider than its frame (the Buttons and states grid, the Tables table). It scrolls sideways
 * inside its own box and only then becomes a labelled, keyboard reachable region: Tab reaches it, the arrow keys scroll
 * it, it has a visible focus ring, and the tile shows "Swipe sideways to see the full preview". The page never scrolls.
 */
export function ScrollFrame({ className, children }: { className: string; children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  const [id] = useState(() => `frame-${++counter}`);
  const hint = useContext(ScrollHintContext);
  const report = hint?.report;

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => setScrolls(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    report?.(id, scrolls);
    return () => report?.(id, false);
  }, [report, id, scrolls]);

  return (
    <div
      ref={frame}
      className={`${className} pvx-frame`}
      {...(scrolls ? { tabIndex: 0, role: "region", "aria-label": "Preview, scrolls sideways", "aria-describedby": hint?.hintId } : {})}
    >
      {children}
    </div>
  );
}
