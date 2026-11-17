"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { DEMO_COLORS, DEMO_FONTS } from "./demo-constants";
import { useLanding } from "./landing-shell";

/** Font stacks for the sample page: next/font's families (set in fonts.ts), with plain fallbacks. */
const FONT_STACK: Record<string, string> = {
  Geist: 'var(--f-geist), system-ui, sans-serif',
  Newsreader: 'var(--f-newsreader), Georgia, serif',
  "IBM Plex Sans": 'var(--f-plex), system-ui, sans-serif',
};

type GhostState = "idle" | "playing" | "stopped" | "off";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Sets a range input the way a person does: the value changes and an `input` event fires, so React's onChange runs. */
function slide(input: HTMLInputElement, value: number) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, String(value));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** True when the visitor asked their system for reduced motion. */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (listener) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function Demo() {
  const { input, setInput, view, engineReady } = useLanding();
  const reduced = useReducedMotion();
  const [playState, setGhostState] = useState<GhostState>("idle");
  const ghostState: GhostState = reduced ? "off" : playState;
  const stage = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const swatches = useRef<HTMLDivElement>(null);
  const fonts = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const engineReadyRef = useRef(engineReady);
  const radiusRef = useRef(input.radius);
  useEffect(() => {
    engineReadyRef.current = engineReady;
    radiusRef.current = input.radius;
  });

  // The self playing demo. A ghost cursor changes the color, drags the corners slider and switches the type by operating the
  // real controls, and it stops for good at the first touch, tap or key press inside the stage. It never plays with reduced motion.
  useEffect(() => {
    const stageEl = stage.current;
    const ghostEl = ghost.current;
    if (!stageEl || !ghostEl) return;
    if (reduced) return;
    let stopped = false;
    let visible = false;
    let started = false;
    const stop = () => {
      stopped = true;
      ghostEl.classList.remove("on", "press");
      setGhostState("stopped");
    };
    (["pointerdown", "keydown", "touchstart"] as const).forEach((type) => stageEl.addEventListener(type, stop, { capture: true, passive: true }));

    const ready = async () => {
      while ((!visible || !engineReadyRef.current) && !stopped) await sleep(250);
    };
    const place = (el: Element, fx = 0.5, fy = 0.5) => {
      const r = el.getBoundingClientRect();
      const s = stageEl.getBoundingClientRect();
      ghostEl.style.transform = `translate(${r.left - s.left + r.width * fx}px, ${r.top - s.top + r.height * fy}px)`;
    };
    const go = async (el: Element, fx?: number, fy?: number) => {
      if (stopped) return;
      ghostEl.classList.add("on");
      place(el, fx, fy);
      await sleep(1050);
    };
    const tap = async () => {
      if (stopped) return;
      ghostEl.classList.add("press");
      await sleep(150);
      ghostEl.classList.remove("press");
    };
    const pickColor = async (i: number) => {
      await ready();
      const button = swatches.current?.querySelectorAll<HTMLButtonElement>("button.sw")[i];
      if (stopped || !button) return;
      await go(button);
      if (stopped) return;
      await tap();
      if (stopped) return;
      button.click();
      await sleep(900);
    };
    const pickFont = async (i: number) => {
      await ready();
      const button = fonts.current?.querySelectorAll<HTMLButtonElement>("button")[i];
      if (stopped || !button) return;
      await go(button);
      if (stopped) return;
      await tap();
      if (stopped) return;
      button.click();
      await sleep(900);
    };
    const dragCorners = async (to: number) => {
      await ready();
      const range = slider.current;
      if (stopped || !range) return;
      const from = radiusRef.current;
      await go(range, from / 20);
      if (stopped) return;
      await tap();
      ghostEl.classList.add("free");
      const t0 = performance.now();
      await new Promise<void>((done) => {
        const step = (now: number) => {
          if (stopped) return done();
          const k = Math.min(1, (now - t0) / 1000);
          const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          const value = Math.round((from + (to - from) * e) / 2) * 2;
          if (value !== radiusRef.current) slide(range, value);
          place(range, (from + (to - from) * e) / 20);
          if (k < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      });
      ghostEl.classList.remove("free");
      await sleep(700);
    };
    const sequence = [
      () => pickColor(1),
      () => dragCorners(16),
      () => pickFont(1),
      () => pickColor(2),
      () => dragCorners(2),
      () => pickFont(2),
      () => pickColor(3),
      () => dragCorners(10),
      () => pickColor(0),
      () => dragCorners(0),
      () => pickFont(0),
    ];
    const loop = async () => {
      setGhostState("playing");
      await sleep(900);
      while (!stopped) {
        for (let i = 0; i < sequence.length && !stopped; i++) await sequence[i]();
        if (stopped) break;
        ghostEl.classList.remove("on");
        await sleep(4000);
      }
    };
    const begin = () => {
      if (started || stopped) return;
      started = true;
      void loop();
    };

    // Start as soon as the top of the stage is on screen. A tall stage never reaches a high visibility ratio on a short window.
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) begin();
      },
      { threshold: 0, rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(stageEl);
    return () => {
      stopped = true;
      observer.disconnect();
      (["pointerdown", "keydown", "touchstart"] as const).forEach((type) => stageEl.removeEventListener(type, stop, { capture: true }));
    };
  }, [reduced]);

  const heading = FONT_STACK[view.heading] ?? FONT_STACK.Geist;
  const body = FONT_STACK[view.body] ?? FONT_STACK.Geist;
  const sampleVars = {
    "--b": view.brand,
    "--ob": view.onBrand.hex,
    "--r": `${view.radius.control}px`,
    "--rc": `${view.radius.card}px`,
    "--rs": `${view.radius.small}px`,
    "--sh": heading,
    "--sb": body,
  } as CSSProperties;

  return (
    <div className="stage" id="stage" ref={stage} style={{ "--b": view.brand } as CSSProperties} data-ghost={ghostState}>
      <div className="tools">
        <div className="ctl">
          <span className="lab" id="clab">
            Brand color
          </span>
          <div className="swatches" role="group" aria-labelledby="clab" id="swatches" ref={swatches}>
            {DEMO_COLORS.map((color) => (
              <button
                key={color.hex}
                type="button"
                className="sw"
                style={{ "--c": color.hex } as CSSProperties}
                aria-label={color.name}
                aria-pressed={input.brand.toLowerCase() === color.hex.toLowerCase()}
                data-hex={color.hex}
                onClick={() => setInput({ brand: color.hex })}
              />
            ))}
            <label className="custom" aria-label="Pick any color">
              <input type="color" value={input.brand.toLowerCase()} onChange={(event) => setInput({ brand: event.target.value.toUpperCase() })} aria-label="Pick any color" />
            </label>
          </div>
        </div>
        <div className="ctl">
          <label className="lab" htmlFor="radius">
            Corners
          </label>
          <div className="range">
            <input id="radius" ref={slider} type="range" min={0} max={20} step={2} value={input.radius} onChange={(event) => setInput({ radius: Number(event.target.value) })} />
            <span className="val" id="rv">
              {input.radius}px
            </span>
          </div>
        </div>
        <div className="ctl">
          <span className="lab" id="flab">
            Type
          </span>
          <div className="seg" role="group" aria-labelledby="flab" id="fonts" ref={fonts}>
            {DEMO_FONTS.map((font, i) => (
              <button key={font.label} type="button" aria-pressed={input.font === i} data-i={i} onClick={() => setInput({ font: i })}>
                {font.label}
              </button>
            ))}
          </div>
        </div>
        <p className="verdict" id="verdict" aria-live="polite" data-pass={view.onBrand.passes ? "true" : "false"}>
          <i className={view.onBrand.passes ? "" : "bad"} />
          <span>
            Button text is <b data-verdict-color>{view.onBrand.white ? "white" : "dark"}</b>, <b data-verdict-ratio>{view.onBrand.ratio.toFixed(1)}:1</b>.{" "}
            {view.onBrand.passes ? "Passes AA." : "Below 4.5:1, Plinth suggests a small adjustment."}
          </span>
        </p>
      </div>

      <div className="views">
        <div className="sample" id="sample" aria-label="Sample product page using your brand" style={sampleVars}>
          <div className="s-top">
            <div className="s-brand">
              <span className="s-logo">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <rect x="1" y="8" width="12" height="4" rx="1" fill="currentColor" />
                  <rect x="3" y="2" width="8" height="4" rx="1" fill="currentColor" opacity=".6" />
                </svg>
              </span>
              Acme Billing
            </div>
            <span className="s-av" aria-hidden="true">
              MO
            </span>
          </div>
          <div>
            <div className="s-title">Pricing</div>
            <p>Pick the plan that fits your team.</p>
          </div>
          <div className="plans">
            <div className="plan">
              <div className="name">Starter</div>
              <div className="price">
                $19 <small>per month</small>
              </div>
              <ul>
                <li>25 invoices a month</li>
                <li>1 user</li>
              </ul>
              <button className="sbtn second" type="button">
                Choose Starter
              </button>
            </div>
            <div className="plan pick">
              <div className="name">
                Team <span className="tag">Recommended</span>
              </div>
              <div className="price">
                $49 <small>per month</small>
              </div>
              <ul>
                <li>Unlimited invoices</li>
                <li>Up to 5 users</li>
              </ul>
              <button className="sbtn primary" type="button">
                Choose Team
              </button>
            </div>
            <div className="plan">
              <div className="name">Business</div>
              <div className="price">
                $99 <small>per month</small>
              </div>
              <ul>
                <li>Unlimited invoices</li>
                <li>Unlimited users</li>
              </ul>
              <button className="sbtn second" type="button">
                Choose Business
              </button>
            </div>
          </div>
          <div className="s-form">
            <label className="field" htmlFor="email">
              Work email
              <input id="email" type="email" placeholder="you@company.com" autoComplete="off" />
            </label>
            <button className="sbtn primary" type="button">
              Start trial
            </button>
          </div>
          <div className="state">
            <span className="badge">Active</span> Your trial runs for 14 days.
          </div>
        </div>

        <div className="file">
          <div className="file-head">
            <code>SKILL.md</code>
            <span>updates as you change things</span>
          </div>
          <pre id="code" data-excerpt aria-label="SKILL.md excerpt">
            {view.excerpt.map((line, i) => (
              <span key={i} className="ln">
                {line.heading ? (
                  <span className="h">{line.key}</span>
                ) : (
                  <>
                    <span className="k">{line.key}</span>
                    {line.swatch ? <span className="dot" style={{ background: line.swatch }} /> : null}
                    {line.value}
                  </>
                )}
                {i < view.excerpt.length - 1 ? "\n" : ""}
              </span>
            ))}
          </pre>
          <div className="file-foot">A short excerpt. The full file runs about {Math.round(view.fileKiB)} KiB and also holds spacing, components, tone and do and don&apos;t rules.</div>
        </div>
      </div>

      <div className="ghost" ref={ghost} aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 26 26">
          <path d="M4 2.5l16 9.2-7 1.8-3.4 6.6z" fill="#fff" stroke="#0D0D0F" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
