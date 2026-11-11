"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Shows a normal desktop page at a smaller scale with a transform (not zoom), so a 2px border stays 2px before
 * scaling and cards line up. The outer box takes the scaled height, so the frame scrolls only as far as the page.
 */
export function ScaledStage({ scale, children }: { scale: number; children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = inner.current;
    if (!element) return;
    const measure = () => setHeight(element.offsetHeight * scale);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [scale]);

  return (
    <div style={{ height: height ?? "100%", minHeight: "100%" }}>
      <div ref={inner} style={{ width: `${100 / scale}%`, minHeight: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
