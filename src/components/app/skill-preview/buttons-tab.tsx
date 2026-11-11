"use client";

import { CircleAlert, LoaderCircle, Trash2 } from "lucide-react";
import { SELECTION_RULES, useDesignSystem } from "@/lib/design-system";
import { PvIcon } from "../preview-icon";

const Trash = () => <PvIcon icon={Trash2} />;

const VARIANTS = ["primary", "secondary", "tertiary", "destructive"] as const;
const STATES = [
  { id: "default", label: "Default", className: "" },
  { id: "hover", label: "Hover", className: " is-hover" },
  { id: "pressed", label: "Pressed", className: " is-pressed" },
  { id: "focus", label: "Focus", className: " is-focus" },
  { id: "disabled", label: "Disabled", className: "" },
] as const;

const cap = (word: string) => word[0].toUpperCase() + word.slice(1);

/** Buttons, loading, inputs and selection controls, all drawn with the skill file's own classes. */
export function ButtonsTab() {
  const { tokens } = useDesignSystem();
  // When the brand is close to the error red, destructive is tinted and delete actions get a trash icon.
  const tinted = tokens.controls.buttons.destructiveStyle === "tinted";
  return (
    <div className="pvx-page">
      <div className="pvx-head">
        <h1>Buttons and states</h1>
        <p>Every variant in every state. Sample content.</p>
      </div>

      <section className="pvx-section" aria-label="Button states">
        <h2>Buttons</h2>
        <div className="pvx-matrix">
          <span />
          {STATES.map((state) => (
            <span key={state.id} className="pvx-label">
              {state.label}
            </span>
          ))}
          {VARIANTS.map((variant) => (
            <Row key={variant} variant={variant} tinted={tinted} />
          ))}
        </div>
        {tinted ? (
          <div className="pvx-row">
            <span className="pvx-label">Confirmation dialog only</span>
            <button type="button" className="btn btn--confirm">
              <Trash />
              Delete project
            </button>
          </div>
        ) : null}
        <p className="pvx-note">One primary button per view. Only that one button carries the border beam.{tinted ? " Your brand is close to the error red, so destructive is tinted and solid red is kept for confirmation dialogs." : ""}</p>
      </section>

      <section className="pvx-section" aria-label="Loading">
        <h2>Loading</h2>
        <div className="pvx-row">
          {VARIANTS.map((variant) => (
            <button key={variant} type="button" className={`btn btn--${variant}`} aria-busy="true">
              <PvIcon icon={LoaderCircle} className="pvx-spin" />
              Saving
            </button>
          ))}
        </div>
        <p className="pvx-note">Loading keeps the full color, adds a spinner and ignores clicks. Only disabled is faded.</p>
      </section>

      <section className="pvx-section" aria-label="Inputs">
        <h2>Inputs</h2>
        <div className="pvx-cols">
          <div className="field">
            <label htmlFor="pv-in-default">Full name</label>
            <input id="pv-in-default" className="input" placeholder="Alex Morgan" />
            <p className="field__help">Default</p>
          </div>
          <div className="field">
            <label htmlFor="pv-in-focus">Full name</label>
            <input id="pv-in-focus" className="input is-focus" defaultValue="Alex Morgan" />
            <p className="field__help">Focused</p>
          </div>
          <div className="field">
            <label htmlFor="pv-in-error">Email</label>
            <input id="pv-in-error" className="input" aria-invalid="true" aria-describedby="pv-in-error-help" defaultValue="alex.morgan@example" />
            <p id="pv-in-error-help" className="field__help field__help--error pvx-error">
              <PvIcon icon={CircleAlert} />
              Enter a full email address, like name@example.com.
            </p>
          </div>
        </div>
      </section>

      <section className="pvx-section" aria-label="Checkbox, radio and switch">
        <h2>Checkbox, radio and switch</h2>
        <div className="pvx-cols">
          <div className="pvx-box">
            <label className="pvx-choice">
              <input type="checkbox" className="check" readOnly /> Unchecked
            </label>
            <label className="pvx-choice">
              <input type="checkbox" className="check" defaultChecked /> Checked
            </label>
            <label className="pvx-choice">
              <input type="checkbox" className="check" disabled /> Disabled
            </label>
            <label className="pvx-choice">
              <input type="checkbox" className="check" aria-invalid="true" /> Error
            </label>
          </div>
          <div className="pvx-box">
            <label className="pvx-choice">
              <input type="radio" name="pv-radio" className="radio" readOnly /> Unselected
            </label>
            <label className="pvx-choice">
              <input type="radio" name="pv-radio" className="radio" defaultChecked /> Selected
            </label>
            <label className="pvx-choice">
              <input type="radio" name="pv-radio-2" className="radio" disabled /> Disabled
            </label>
          </div>
          <div className="pvx-box">
            <div className="pvx-choice">
              <button type="button" role="switch" aria-checked="false" aria-label="Off" className="switch">
                <span className="switch__thumb" />
              </button>
              Off
            </div>
            <div className="pvx-choice">
              <button type="button" role="switch" aria-checked="true" aria-label="On" className="switch">
                <span className="switch__thumb" />
              </button>
              On
            </div>
            <div className="pvx-choice">
              <button type="button" role="switch" aria-checked="false" aria-label="Disabled" className="switch" disabled>
                <span className="switch__thumb" />
              </button>
              Disabled
            </div>
          </div>
        </div>
        <div className="pvx-cols">
          {SELECTION_RULES.map((rule) => (
            <p key={rule.control} className="pvx-note">
              <strong style={{ color: "var(--foreground)" }}>{cap(rule.control)}:</strong> use when {rule.useWhen[0].toLowerCase() + rule.useWhen.slice(1)} Avoid: {rule.avoidWhen[0].toLowerCase() + rule.avoidWhen.slice(1)}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}

function Row({ variant, tinted }: { variant: (typeof VARIANTS)[number]; tinted: boolean }) {
  return (
    <>
      <span className="pvx-label">{cap(variant)}</span>
      {STATES.map((state) => (
        <span key={state.id}>
          {/* Only the primary default button is the one border beam on this screen. */}
          <button
            type="button"
            className={`btn btn--${variant}${state.className}${variant === "primary" && state.id === "default" ? " cta" : ""}`}
            disabled={state.id === "disabled"}
          >
            {variant === "destructive" && tinted ? <Trash /> : null}
            {variant === "destructive" && tinted ? "Delete" : "Button"}
          </button>
        </span>
      ))}
    </>
  );
}
