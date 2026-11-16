import Image from "next/image";
import Link from "next/link";
import { PlinthWordmark } from "@/components/brand/plinth-wordmark";
import { Demo } from "@/components/landing/demo";
import { computeDemo, computeFacts } from "@/components/landing/demo-engine";
import { DEMO_DEFAULT } from "@/components/landing/demo-constants";
import { HowSteps } from "@/components/landing/how-steps";
import { LandingShell } from "@/components/landing/landing-shell";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import "@/components/landing/landing.css";

const MARQUEE = [
  "Buttons",
  "Inputs",
  "Selection controls",
  "Tables",
  "Cards",
  "Forms",
  "Tabs",
  "Dialogs and toasts",
  "Pricing pages",
  "Settings pages",
  "Dashboards",
  "Charts",
  "Empty states",
  "Focus rings",
  "Tone of voice",
  "Do and don't rules",
];

const INSIDE = [
  {
    title: "Tokens",
    text: "Colors with contrast checked pairs, type scale, radius, spacing, borders and shadows. Real code, not descriptions.",
    icon: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
  },
  {
    title: "Component recipes",
    text: "Buttons in every state, forms, tables, cards, dashboards and charts, with the exact classes to copy.",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </>
    ),
  },
  {
    title: "Signature details",
    text: "The moves that make it feel like your brand: the featured card, hover, focus ring and main call to action.",
    icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  },
  {
    title: "Tone of voice",
    text: "How buttons, errors and empty states should sound, with do and don't pairs.",
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    title: "Accessibility",
    text: "Contrast checked text pairs, focus rings, reduced motion and chart colors that stay apart.",
    icon: (
      <>
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  {
    title: "Final checklist",
    text: "The AI audits its own work against your rules and reports what failed.",
    icon: <path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8" />,
  },
];

const QUESTIONS = [
  { q: "Is it really free?", a: "Yes. There is no login and no paid tier. You build your file in the browser and download it." },
  { q: "Where does my work go?", a: "Your choices stay in your browser and save automatically. You can download the file and import it later to carry on where you stopped." },
  { q: "Which AI tools can use the file?", a: "Claude Code reads it as SKILL.md. Codex and ChatGPT read it as AGENTS.md. It is the same content in both." },
  { q: "What if my brand color is hard to read?", a: "Plinth checks contrast for you. By default it keeps your exact color and picks dark or light text, whichever passes. If neither passes, it tells you and offers a small adjustment." },
];

/** The landing page. The numbers in the facts row and the first state of the demo come from the app's real engine. */
export default function Home() {
  const initial = computeDemo(DEMO_DEFAULT);
  const facts = computeFacts();
  return (
    <LandingShell initial={initial}>
      <div className="wrap">
        <header className="top">
          <Link className="mark" href="/" aria-label="Plinth home">
            <PlinthWordmark height={24} />
          </Link>
          <nav aria-label="Main">
            <ThemeToggle />
            <Link className="btn" href="/app">
              Open Plinth
            </Link>
          </nav>
        </header>

        <main id="top">
          <div className="hero">
            <h1>
              Are you building a solid app? <span>Here is your first stone for the foundation.</span>
            </h1>
            <div className="hero-side">
              <p className="lede">
                Plinth turns your brand choices into one markdown file. <span>Claude Code, Codex and ChatGPT read it before they build, so your product looks like yours from the first screen.</span>
              </p>
              <div className="cta-row">
                <Link className="btn big" href="/app">
                  Build your brand file
                </Link>
                <span className="small">Free. No login. Runs in your browser.</span>
              </div>
            </div>
          </div>

          <Demo />

          <div className="facts" aria-label="What is inside the file">
            <div>
              <b>{facts.scaleSteps} steps</b>
              <span>in every color scale, for brand and neutral</span>
            </div>
            <div>
              <b>{facts.aa}:1</b>
              <span>text contrast, checked for every pair</span>
            </div>
            <div>
              <b>{facts.grid}px</b>
              <span>grid for type, spacing and radius</span>
            </div>
            <div>
              <b>{facts.stacks} stacks</b>
              <span>Next.js, React and plain HTML</span>
            </div>
          </div>

          <div className="marq" aria-label="Parts of your design system that the file covers">
            <div className="marq-track">
              <div className="marq-set">
                {MARQUEE.map((name) => (
                  <span className="chip" key={name}>
                    {name}
                  </span>
                ))}
              </div>
              <div className="marq-set" aria-hidden="true">
                {MARQUEE.map((name) => (
                  <span className="chip" key={name}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>

        <section aria-labelledby="in-t">
          <div className="sec-head">
            <h2 className="sec-title" id="in-t">
              Not a list of colors. A rulebook your AI follows.
            </h2>
            <p className="sec-sub">The file is written for AI tools: exact values, exact class names, and rules for the decisions in between.</p>
          </div>
          <div className="inside-grid">
            {INSIDE.map((card) => (
              <div className="icard" key={card.title}>
                <span className="ico" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {card.icon}
                  </svg>
                </span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
          <p className="inside-note">Written for Claude Code (SKILL.md) and Codex (AGENTS.md), in three stacks. ChatGPT works with a Project upload.</p>
        </section>

        <HowSteps />

        <section className="story" aria-labelledby="why">
          <h2 className="sec-title" id="why">
            Why I built this
          </h2>
          <div className="body">
            <p>At my last company we had more than nine ERP products, and none of them had a design language of its own. Every time we prototyped, we took a screenshot of the product page, redesigned the components, and built from there.</p>
            <p>When we proposed one shared design system, the answer was that it would be tedious and slow. That stuck with me. Why does it have to be? Why can&apos;t there be a starter version, a foundation, that you build on later?</p>
            <p>Then I noticed that more and more people now build their apps with AI tools. So I asked myself: what if the design system came as a skill file? Before the AI builds anything, it already knows your design language.</p>
            <p className="last">That is Plinth.</p>
            <p className="sign">
              <b>Kiran</b>, Brand and Product Designer
            </p>
          </div>
        </section>

        <section className="ba-wrap" aria-labelledby="ba-t">
          <h2 className="sec-title" id="ba-t">
            The same page, before and after
          </h2>
          <p className="sec-sub">Both pages were built by an AI coding tool from a plain request for a pricing page.</p>
          <div className="ba">
            <figure>
              <div className="shot">
                <Image src="/landing/before.jpg" width={1200} height={640} sizes="(max-width: 960px) 100vw, 600px" alt="A pricing page with a serif typeface and an indigo accent, built without a skill file" />
              </div>
              <figcaption>
                <b>Without a skill file</b>The AI picked its own serif type, its own indigo and its own spacing.
              </figcaption>
            </figure>
            <figure>
              <div className="shot">
                <Image src="/landing/after.jpg" width={1200} height={640} sizes="(max-width: 960px) 100vw, 600px" alt="A pricing page with one typeface, even spacing and a single accent, built with a Plinth skill file" />
              </div>
              <figcaption>
                <b>With a Plinth file</b>Type, spacing, radius and one accent color all follow the rules in the file.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="faq-wrap" aria-labelledby="faq-t">
          <div className="faq-grid">
            <h2 className="sec-title" id="faq-t">
              Questions
            </h2>
            <div className="faq">
              {QUESTIONS.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="close" aria-labelledby="close-t">
          <h2 id="close-t">Lay the first stone.</h2>
          <div className="cta-row">
            <Link className="btn big" href="/app">
              Open Plinth
            </Link>
            <span className="small">About ten minutes to a finished file.</span>
          </div>
        </section>

        <footer>
          <span>Made by Kiran B. Free to use.</span>
          <span>
            <a href="mailto:kiranjinde19@gmail.com?subject=Plinth%20feedback">Send feedback</a>
          </span>
        </footer>
      </div>
    </LandingShell>
  );
}
