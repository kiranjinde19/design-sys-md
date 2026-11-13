"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** The page is drawn this wide whenever the frame is too narrow for the normal scale. */
const DESIGN_WIDTH = 1000;
/** Below this frame width (a phone) the page stays readable at PHONE_SCALE and scrolls sideways inside its own frame. */
const PHONE_FRAME = 480;
const PHONE_SCALE = 0.6;

export type StageScale = { scale: number; scrolls: boolean };

/**
 * Shows a normal desktop page at a smaller scale with a transform (not zoom), so a 2px border stays 2px before
 * scaling and cards line up. The outer box takes the scaled height, so the frame scrolls only as far as the page.
 *  - Wide frame (650px and up): the given scale, the page as wide as the frame divided by the scale.
 *  - Medium frame (480 to 650px): the page is 1000px wide and the scale fits it to the frame.
 *  - Phone frame (under 480px): the page is 1000px wide at 60% and scrolls sideways inside this frame (a labelled,
 *    keyboard reachable region). The page itself never scrolls sideways.
 * The scale in use is reported, so the label can show the real number.
 */
export function ScaledStage({ scale, children, hintId, onScale }: { scale: number; children: ReactNode; hintId?: string; onScale?: (info: StageScale) => void }) {
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

  const wide = frame === null || frame / scale >= DESIGN_WIDTH;
  const phone = !wide && frame !== null && frame < PHONE_FRAME;
  const applied = wide ? scale : phone ? PHONE_SCALE : frame! / DESIGN_WIDTH;

  useEffect(() => {
    onScale?.({ scale: applied, scrolls: phone });
  }, [applied, phone, onScale]);

  const height = innerHeight === null ? undefined : innerHeight * applied;
  return (
    <div
      ref={outer}
      {...(phone ? { tabIndex: 0, role: "region", "aria-label": "Preview, scrolls sideways", "aria-describedby": hintId } : {})}
      className={phone ? "tool-inset-focus" : undefined}
      style={{ overflowX: phone ? "auto" : "hidden", overflowY: "hidden" }}
    >
      <div style={{ width: phone ? DESIGN_WIDTH * applied : undefined, height: height ?? "100%" }}>
        <div ref={inner} style={{ width: wide ? `${100 / scale}%` : DESIGN_WIDTH, transform: `scale(${applied})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
