"use client";

import type { CSSProperties } from "react";
import { featuredHoverFix, useDesignSystem } from "@/lib/design-system";
import { asStyle } from "@/components/preview/preview-stage";

/** Sample content. It is generic on purpose and labeled as sample content wherever it is shown. */
const PLANS = [
  { name: "Starter", description: "For trying things out.", price: "$0", features: ["1 project", "Community help", "Basic reports"] },
  { name: "Pro", description: "For a small team that ships every week and wants room to grow.", price: "$29", features: ["Unlimited projects", "Priority help", "Advanced reports"], featured: true },
  { name: "Team", description: "For larger groups.", price: "$79", features: ["Everything in Pro", "Roles and access", "Audit history"] },
] as const;

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const cssText = (recipe: Record<string, string | number>) => Object.entries(recipe).map(([key, value]) => `${kebab(key)}: ${typeof value === "number" && key !== "fontWeight" ? `${value}px` : value};`).join(" ");

/**
 * The pricing page, built only from the user's design system. Sizes, colors, radius, spacing, shadows,
 * the card style, the crisp featured border and the border beam all come from the tokens.
 */
export function PricingPreview() {
  const { tokens } = useDesignSystem();
  const { signature, controls } = tokens;
  const cta = signature.primaryCta;
  const hover = { ...signature.hover.css };
  const transition = hover.transition;
  delete hover.transition;
  const fix = featuredHoverFix(hover, signature.featuredHighlight.css);

  // Hover works on the cards through a small stylesheet, because inline styles can not express :hover.
  const hoverCss = [
    transition ? `.pv-hover { transition: ${transition}; }` : "",
    Object.keys(hover).length ? `.pv-hover:hover { ${cssText(hover)} }` : "",
    Object.keys(fix).length ? `.pv-featured:hover { ${cssText(fix)} }` : "",
    "@media (prefers-reduced-motion: reduce) { .pv-hover, .pv-hover:hover { transition: none; transform: none; } }",
  ].join("\n");

  // The recommended button: the border beam when chosen, otherwise the chosen call to action look.
  const recommended: CSSProperties = cta.className ? {} : asStyle(cta.css);

  return (
    <div className="pv">
      <style>{hoverCss}</style>
      {cta.stylesheet ? <style>{cta.stylesheet}</style> : null}

      <div className="pv-bar">
        <strong style={{ fontFamily: "var(--pv-font-heading)", fontSize: "var(--pv-text-lg)" }}>Sample product</strong>
        <span className="pv-btn pv-btn--secondary" style={{ height: controls.buttons.height.sm }}>
          Sign in
        </span>
      </div>

      <div className="pv-page">
        <div className="pv-head">
          <h1 style={{ fontSize: "var(--pv-text-4xl)", lineHeight: "var(--pv-leading-4xl)" }}>Simple pricing</h1>
          <p style={{ color: "var(--pv-muted-foreground)", maxWidth: 520 }}>Choose a plan that fits. Sample content, replace it with your own.</p>
        </div>

        <div className="pv-plans">
          {PLANS.map((plan) => {
            const featured = "featured" in plan;
            // A thicker featured border must not move the content: take the extra width out of the padding.
            const borderWidth = (recipe: Record<string, string | number>) => parseFloat(String(recipe.border ?? "0")) || 0;
            const extra = Math.max(0, borderWidth(signature.featuredHighlight.css) - borderWidth(signature.cardStyle.css));
            const featuredStyle: CSSProperties = { ...asStyle(signature.featuredHighlight.css), margin: 0, padding: `calc(var(--pv-pad-card) - ${extra}px)` };
            return (
              <div
                key={plan.name}
                className={`pv-plan pv-hover${featured ? " pv-featured" : ""}`}
                style={{ ...asStyle(signature.cardStyle.css), padding: "var(--pv-pad-card)", ...(featured ? featuredStyle : {}) }}
              >
                <div className="pv-plan__title">
                  <h3 style={{ fontSize: "var(--pv-text-xl)", lineHeight: "var(--pv-leading-xl)" }}>{plan.name}</h3>
                  {featured ? <span className="pv-rec">Recommended</span> : null}
                </div>
                <p className="pv-plan__desc">{plan.description}</p>
                <p className="pv-plan__price">
                  {plan.price}
                  <small> / month</small>
                </p>
                <div style={asStyle(signature.divider.css)} />
                <ul className="pv-plan__features">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <span
                  className={`pv-btn pv-plan__cta ${featured ? `pv-btn--primary${cta.className ? ` ${cta.className}` : ""}` : "pv-btn--secondary"}`}
                  style={featured ? recommended : undefined}
                >
                  {featured ? "Start free" : "Choose plan"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
