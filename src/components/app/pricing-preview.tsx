"use client";

import { Boxes, Check, Rocket, Sprout, Users, type LucideIcon } from "lucide-react";
import { PvIcon } from "./preview-icon";
import { SkillScope } from "./skill-preview/skill-scope";
import { useVoiceCopy } from "./use-voice-copy";

/** Sample content. It is generic on purpose and labeled as sample content wherever it is shown. */
const PLANS: readonly { name: string; icon: LucideIcon; description: string; price: string; features: readonly string[]; featured?: boolean }[] = [
  { name: "Starter", icon: Sprout, description: "For trying things out.", price: "$0", features: ["1 project", "Community help", "Basic reports"] },
  { name: "Pro", icon: Rocket, description: "For a small team that ships every week and wants room to grow.", price: "$29", features: ["Unlimited projects", "Priority help", "Advanced reports"], featured: true },
  { name: "Team", icon: Users, description: "For larger groups.", price: "$79", features: ["Everything in Pro", "Roles and access", "Audit history"] },
];

/**
 * The pricing page, drawn with the classes and CSS the generated skill file defines (`header`, `plans`, `plan`, `card`,
 * `card-hover`, `card-featured`, `icon-tile`, `divider`, `btn`, `cta`), so the preview shows what an AI would build
 * from the file. Only the price and feature list typography is preview layout (`pvx-`), because the file describes
 * those in words, not CSS.
 */
export function PricingPreview() {
  const copy = useVoiceCopy();
  return (
    <SkillScope>
      <div className="pvx-pricing">
        <header className="header" style={{ justifyContent: "space-between" }}>
          <strong className="pvx-logo">
            <PvIcon icon={Boxes} size={20} />
            Sample product
          </strong>
          <button type="button" className="btn btn--secondary btn--sm">
            Sign in
          </button>
        </header>

        <div className="pvx-pricing__page">
          <div className="pvx-pricing__head">
            <h1>Simple pricing</h1>
            <p>Choose a plan that fits. Sample content, replace it with your own.</p>
          </div>

          <div className="plans">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`card card-hover plan${plan.featured ? " card-featured" : ""}`}>
                <span className="icon-tile">
                  <PvIcon icon={plan.icon} size={20} />
                </span>
                <div className="pvx-plan__title">
                  <h3>{plan.name}</h3>
                  {plan.featured ? <span className="pvx-rec">Recommended</span> : null}
                </div>
                <p className="plan__desc">{plan.description}</p>
                <p className="pvx-price">
                  {plan.price}
                  <small> / month</small>
                </p>
                <div className="divider" />
                <ul className="pvx-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <PvIcon icon={Check} size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button type="button" className={`btn plan__cta ${plan.featured ? "btn--primary cta" : "btn--secondary"}`}>
                  {plan.featured ? copy.pricing.main : "Choose plan"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkillScope>
  );
}
