"use client";

import type { CSSProperties } from "react";
import {
  SIGNATURE_CATALOG,
  useDesignSystem,
  type ButtonState,
  type ButtonVariant,
  type CssRecipe,
  type InputState,
} from "@/lib/design-system";
import { Section } from "./section";

const asStyle = (recipe: CssRecipe) => recipe as CSSProperties;

const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "tertiary", "destructive"];
const BUTTON_STATES: ButtonState[] = ["default", "hover", "pressed", "disabled", "loading"];
const INPUT_STATES: InputState[] = ["default", "hover", "focus", "error", "disabled"];

export function DebugComponents() {
  const { tokens } = useDesignSystem();
  const { controls, colors, typography, borders, signature, icons, spacing, radius } = tokens;
  const body = typography.sizes.find((size) => size.name === "base")!;
  const small = typography.sizes.find((size) => size.name === "sm")!;
  const stage: CSSProperties = {
    background: colors.roles.background,
    color: colors.roles.text,
    fontFamily: typography.body.previewStack,
    fontSize: body.px,
    border: `${borders.width}px solid ${borders.color}`,
    borderRadius: radius.lg,
    padding: spacing.semantic.cardPadding,
  };
  const cta = signature.primaryCta;

  return (
    <>
      <Section
        title="Buttons"
        description={`Secondary is ${controls.secondaryStyle}. Every state is derived from the brand color. Focus ring comes from the signature details.`}
      >
        <div className="overflow-x-auto" style={stage}>
          <div className="grid min-w-[40rem] gap-3" style={{ gridTemplateColumns: "6rem repeat(5, 1fr)" }}>
            <div />
            {BUTTON_STATES.map((state) => (
              <div key={state} className="text-xs" style={{ color: colors.roles.textMuted }}>
                {state}
              </div>
            ))}
            {BUTTON_VARIANTS.map((variant) => (
              <div key={variant} className="contents">
                <div className="self-center text-xs" style={{ color: colors.roles.textMuted }}>
                  {variant}
                </div>
                {BUTTON_STATES.map((state) => {
                  const s = controls.buttons.variants[variant][state];
                  return (
                    <button
                      key={state}
                      type="button"
                      tabIndex={-1}
                      style={{
                        height: controls.buttons.height.md,
                        paddingInline: controls.buttons.paddingX.md,
                        borderRadius: controls.buttons.radius,
                        fontWeight: controls.buttons.fontWeight,
                        fontSize: body.px,
                        fontFamily: "inherit",
                        border: `${controls.buttons.borderWidth}px solid ${s.borderColor}`,
                        background: s.background,
                        color: s.color,
                        opacity: s.opacity,
                        cursor: state === "disabled" || state === "loading" ? "not-allowed" : "default",
                      }}
                    >
                      {state === "loading" ? "Saving…" : "Button"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Inputs" description="Default, hover, focus, error and disabled.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" style={stage}>
          {INPUT_STATES.map((state) => {
            const s = controls.inputs.states[state];
            return (
              <div key={state} className="space-y-1.5">
                <div style={{ fontSize: small.px, color: colors.roles.textMuted }}>{state}</div>
                <input
                  readOnly
                  disabled={state === "disabled"}
                  placeholder="Placeholder"
                  style={{
                    width: "100%",
                    height: controls.inputs.height,
                    paddingInline: controls.inputs.paddingX,
                    borderRadius: controls.inputs.radius,
                    border: `${controls.inputs.borderWidth}px solid ${s.borderColor}`,
                    background: s.background,
                    color: s.color,
                    fontSize: body.px,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {controls.selectionRules.map((rule) => (
            <div key={rule.control} className="rounded-lg border border-border p-3 text-sm">
              <div className="font-semibold capitalize">{rule.control}</div>
              <p className="mt-1 text-muted-foreground">
                <span className="font-medium text-foreground">Use when: </span>
                {rule.useWhen}
              </p>
              <p className="mt-1 text-muted-foreground">
                <span className="font-medium text-foreground">Avoid when: </span>
                {rule.avoidWhen}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Signature details" description="The seven chosen moves, shown on small samples.">
        <style>{`
          ${cta.keyframes ?? ""}
          @media (prefers-reduced-motion: reduce) { .ds-cta { animation: none !important; } }
        `}</style>
        <div className="grid gap-4 md:grid-cols-2" style={stage}>
          <Sample label={`Featured highlight: ${signature.featuredHighlight.label}`}>
            <div className="p-4" style={{ borderRadius: radius.lg, ...asStyle(signature.cardStyle.css), ...asStyle(signature.featuredHighlight.css) }}>
              Recommended plan
            </div>
          </Sample>
          <Sample label={`Card style: ${signature.cardStyle.label}`}>
            <div className="p-4" style={asStyle(signature.cardStyle.css)}>
              Regular card
            </div>
          </Sample>
          <Sample label={`Hover: ${signature.hover.label} (shown applied)`}>
            <div className="p-4" style={{ ...asStyle(signature.cardStyle.css), ...asStyle(signature.hover.css) }}>
              Card while hovered
            </div>
          </Sample>
          <Sample label={`Primary CTA: ${cta.label}`}>
            <button
              type="button"
              tabIndex={-1}
              className="ds-cta"
              style={{
                height: controls.buttons.height.md,
                paddingInline: controls.buttons.paddingX.lg,
                borderRadius: controls.buttons.radius,
                fontWeight: controls.buttons.fontWeight,
                fontSize: body.px,
                fontFamily: "inherit",
                border: "none",
                ...asStyle(cta.css),
              }}
            >
              Get started
            </button>
          </Sample>
          <Sample label={`Icon container: ${signature.iconContainer.label}`}>
            <span
              className="inline-flex items-center justify-center"
              style={asStyle(signature.iconContainer.css)}
            >
              <svg
                width={icons.sizes.md}
                height={icons.sizes.md}
                viewBox="0 0 24 24"
                fill={icons.fill}
                stroke="currentColor"
                strokeWidth={icons.strokeWidth}
                strokeLinecap={icons.strokeLinecap}
                strokeLinejoin={icons.strokeLinejoin}
                aria-label="Sample shape"
              >
                <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />
              </svg>
            </span>
          </Sample>
          <Sample label={`Focus ring: ${signature.focusRing.label}`}>
            <div
              className="inline-block px-4 py-2"
              style={{
                borderRadius: radius.md,
                border: `${borders.width}px solid ${borders.colorStrong}`,
                ...asStyle(signature.focusRing.css),
              }}
            >
              Focused element
            </div>
          </Sample>
          <Sample label={`Divider: ${signature.divider.label}`}>
            <div style={{ color: colors.roles.textMuted, fontSize: small.px }}>
              Above
              <div style={asStyle(signature.divider.css)} />
              Below
            </div>
          </Sample>
        </div>
        <p className="text-sm text-muted-foreground">
          Options per category:{" "}
          {Object.values(SIGNATURE_CATALOG)
            .map((category) => `${category.label} (${category.options.length})`)
            .join(", ")}
          . Icons: {icons.style}, {icons.strokeWidth}px stroke, {icons.strokeLinecap} ends.
        </p>
      </Section>
    </>
  );
}

function Sample({ label, children }: { label: string; children: React.ReactNode }) {
  const { tokens } = useDesignSystem();
  return (
    <div className="space-y-2">
      <div className="text-xs" style={{ color: tokens.colors.roles.textMuted }}>
        {label}
      </div>
      {children}
    </div>
  );
}
