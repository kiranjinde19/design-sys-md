"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLanding } from "./landing-shell";

/** "Three steps": plays a 12 second loop only while the section is on screen, and rests in its finished state otherwise. */
export function HowSteps() {
  const { view } = useLanding();
  const section = useRef<HTMLElement>(null);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => setPlay(entries[0].isIntersecting), { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={`how-wrap how${play ? " play" : ""}`} id="how" aria-labelledby="how-t" ref={section} data-play={play ? "true" : "false"}>
      <div className="sec-head">
        <h2 className="sec-title" id="how-t">
          Three steps, about ten minutes.
        </h2>
      </div>
      <div className="steps">
        <div className="step">
          <div className="vis" aria-hidden="true">
            <div className="v-lab">
              <span>Colors</span>
              <span>
                Brand, step 6 is <b className="brandhex">{view.brand}</b>
              </span>
            </div>
            <div className="scale">
              {view.scale.map((hex, i) => (
                <i key={i} style={{ background: hex }} />
              ))}
              <span className="ring" />
            </div>
            <div className="v-lab">
              <span>Neutral, {view.neutral.length} steps</span>
            </div>
            <div className="scale">
              {view.neutral.map((hex, i) => (
                <i key={i} style={{ background: hex }} />
              ))}
            </div>
            <div className="v-lab">
              <span>Radius</span>
            </div>
            <div className="rads">
              <i />
              <i />
              <i className="live" />
              <i />
            </div>
          </div>
          <div className="step-body">
            <span className="num">1</span>
            <h3>Build it in minutes</h3>
            <p>Pick a brand color. Scales, type, radius, spacing and shadows are generated and checked. Fine tune any of it, and drag colors onto roles.</p>
          </div>
        </div>

        <div className="step">
          <div className="vis" aria-hidden="true">
            <div className="dl">
              <div className="tabs">
                <span>SKILL.md, Claude Code</span>
                <span>AGENTS.md, Codex</span>
              </div>
              <div className="btns">
                <span className="b dark">Download SKILL.md</span>
                <span className="b light">Copy file</span>
              </div>
              <div className="size">
                <span>File size</span>
                <span>{view.fileKiB.toFixed(1)} of 32 KiB</span>
              </div>
              <div className="bar">
                <i style={{ "--fill": `${(view.fileShare * 100).toFixed(1)}%` } as CSSProperties} />
              </div>
            </div>
            <span className="file-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              SKILL.md saved
            </span>
          </div>
          <div className="step-body">
            <span className="num">2</span>
            <h3>Download one file</h3>
            <p>A single Markdown file, SKILL.md for Claude Code or AGENTS.md for Codex, with the stack you use.</p>
          </div>
        </div>

        <div className="step">
          <div className="vis dark" aria-hidden="true">
            <div className="term">
              <span className="dim">.claude/skills/{view.excerpt[1]?.value}/</span>
              <span>SKILL.md</span>
              <span>&nbsp;</span>
              <span>
                <span className="dim">&gt; </span>
                <span className="typed">Build me a pricing page with three plans.</span>
                <span className="caret" />
              </span>
              <span className="read">Reading SKILL.md first.</span>
            </div>
          </div>
          <div className="step-body">
            <span className="num">3</span>
            <h3>Drop it in and build</h3>
            <p>Put the file in your project, then ask your AI for a page. It reads your rules first.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
