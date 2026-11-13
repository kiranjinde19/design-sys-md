"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** The narrowest page the scaled previews are drawn at. In a narrower frame the page is scaled down further to fit. */
const MIN_DESIGN_WIDTH = 1000;

/**
 * Shows a normal desktop page at a smaller scale with a transform (not zoom), so a 2px border stays 2px before
 * scaling and cards line up. The outer box takes the scaled height, so the frame scrolls only as far as the page.
 * The scale is the given one while the frame is wide enough (the page is then frame width divided by the scale wide);
 * in a narrower frame (a phone) the page stays 1000px wide and the scale shrinks to fit, so nothing scrolls sideways.
 */
export function ScaledStage({ scale, children }: { scale: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<number | null>(null);
  const [innerHeight, setInnerHeight] = useState<number | null>(null);

  useEffect(() => {
    const box = outer.current;
    const page = inner.current;
    if (!box || !page) return;
    const measure = () => {
      setFrame(box.clientWidth);
      setInnerHeight(page.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(page);
    return () => observer.disconnect();
  }, []);

  const wide = frame === null || frame / scale >= MIN_DESIGN_WIDTH;
  const applied = wide ? scale : frame! / MIN_DESIGN_WIDTH;
  return (
    <div ref={outer} style={{ height: innerHeight === null ? "100%" : innerHeight * applied, overflow: "hidden" }}>
      <div ref={inner} style={{ width: wide ? `${100 / scale}%` : MIN_DESIGN_WIDTH, transform: `scale(${applied})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
