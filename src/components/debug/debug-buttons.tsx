"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  useDesignSystem,
  type ButtonState,
  type ButtonVariant,
  type InputState,
  type SelectionControl,
  type SelectionState,
} from "@/lib/design-system";
import { Button } from "@/components/ui/button";
import { PassBadge, Section } from "./section";
import { asStyle, usePreviewStage } from "@/components/preview/preview-stage";

const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "tertiary", "destructive"];
const BUTTON_STATES: ButtonState[] = ["default", "hover", "pressed", "focus", "disabled", "loading"];
const INPUT_STATES: InputState[] = ["default", "hover", "focus", "error", "disabled"];
const SELECTION_CONTROLS: SelectionControl[] = ["checkbox", "radio", "switch"];
const SELECTION_STATES: SelectionState[] = ["default", "hover", "checked", "focus", "disabled", "error"];

function Spinner({ size, strokeWidth, className }: { size: number; strokeWidth: number; className: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth={strokeWidth} />
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray="9.4 28.3"
      />
    </svg>
  );
}

function SelectionPreview({ control, state }: { control: SelectionControl; state: SelectionState }) {
  const { tokens } = useDesignSystem();
  const { selection, focusRing } = tokens.controls;
  const s = selection.states[control][state];
  const checked = state === "checked";
  const ring: CSSProperties = state === "focus" ? asStyle(focusRing) : {};
  const common: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: s.background,
    border: `${selection.borderWidth}px solid ${s.borderColor}`,
    cursor: state === "disabled" ? "not-allowed" : "default",
    ...ring,
  };

  if (control === "checkbox") {
    return (
      <span
        role="checkbox"
        aria-checked={checked}
        aria-disabled={state === "disabled"}
        style={{ ...common, width: selection.size, height: selection.size, borderRadius: selection.radius.checkbox }}
      >
        {checked ? (
          <svg width={selection.size - 4} height={selection.size - 4} viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2.5 6.2l2.4 2.4 4.6-5" stroke={s.markColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
    );
  }

  if (control === "radio") {
    return (
      <span
        role="radio"
        aria-checked={checked}
        aria-disabled={state === "disabled"}
        style={{ ...common, width: selection.size, height: selection.size, borderRadius: selection.radius.radio }}
      >
        {checked ? (
          <span style={{ width: selection.size / 2.5, height: selection.size / 2.5, borderRadius: "50%", background: s.markColor }} />
        ) : null}
      </span>
    );
  }

  const { width, height, thumb } = selection.switch;
  const gap = (height - thumb) / 2;
  return (
    <span
      role="switch"
      aria-checked={checked}
      aria-disabled={state === "disabled"}
      style={{ ...common, position: "relative", width, height, borderRadius: selection.radius.switch }}
    >
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: checked ? width - thumb - gap - selection.borderWidth * 2 : gap - selection.borderWidth,
          width: thumb,
          height: thumb,
          marginTop: -thumb / 2,
          borderRadius: "50%",
          background: s.markColor,
        }}
      />
    </span>
  );
}

function Labelled({ children, label, muted }: { children: ReactNode; label: string; muted?: boolean }) {
  const { tokens, small } = usePreviewStage();
  return (
    <span className="inline-flex items-center gap-2">
      {children}
      <span style={{ fontSize: small.px, color: muted ? tokens.colors.neutral[500] : tokens.colors.roles.foreground }}>{label}</span>
    </span>
  );
}

export function DebugButtons() {
  const { settings, update } = useDesignSystem();
  const { tokens, stage, body, small } = usePreviewStage();
  const secondaryColor = settings.colors.secondary;
  const { controls, colors, spacing } = tokens;
  const { spinner } = controls.buttons;
  const muted = colors.roles["muted-foreground"];
  const pairs = colors.contrastPairs.filter((p) => p.id === "input-on-background" || p.id === "placeholder-on-background");

  return (
    <div className="space-y-10">
      <Section
        title="Buttons"
        description={`Secondary is ${controls.secondaryStyle}. Focus shows the signature focus ring. Loading keeps the full color and adds a spinner. Only disabled is faded.`}
      >
        <style>{spinner.stylesheet}</style>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm">
          <span
            className="size-5 shrink-0 rounded-full border border-border"
            style={{ background: secondaryColor ?? colors.neutral[100] }}
            aria-hidden
          />
          {secondaryColor ? (
            <>
              <span className="min-w-0 flex-1">
                Secondary buttons are drawn from your <strong>secondary color</strong> ({secondaryColor}), steps 100, 200 and 300 for the fill and 900 for text.
              </span>
              <Button size="sm" variant="outline" onClick={() => update({ colors: { secondary: null } })}>
                Remove secondary color
              </Button>
            </>
          ) : (
            <span className="min-w-0 flex-1">
              Secondary buttons are drawn from the <strong>neutral scale</strong>: 200 default, 300 hover, 400 pressed, 900 text. No secondary color has been added.
            </span>
          )}
        </div>
        <div className="overflow-x-auto" style={stage}>
          <div className="grid min-w-[46rem] gap-3" style={{ gridTemplateColumns: "6rem repeat(6, 1fr)" }}>
            <div />
            {BUTTON_STATES.map((state) => (
              <div key={state} className="text-xs" style={{ color: muted }}>
                {state}
              </div>
            ))}
            {BUTTON_VARIANTS.map((variant) => (
              <div key={variant} className="contents">
                <div className="self-center text-xs" style={{ color: muted }}>
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
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: spacing.semantic.inlineGap,
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
                        cursor: state === "disabled" ? "not-allowed" : "default",
                        ...(state === "focus" ? asStyle(controls.focusRing) : {}),
                      }}
                    >
                      {s.spinner ? <Spinner size={spinner.size} strokeWidth={spinner.strokeWidth} className={spinner.className} /> : null}
                      {state === "loading" ? "Saving" : "Button"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="Inputs"
        description="Default, hover, focus (brand border plus the focus ring), error and disabled. Outlines use the input border, the lightest neutral that reaches 3:1."
      >
        <style>{`.ds-input::placeholder { color: ${colors.placeholder}; opacity: 1; }`}</style>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" style={stage}>
          {INPUT_STATES.map((state) => {
            const s = controls.inputs.states[state];
            return (
              <div key={state} className="space-y-1.5">
                <div style={{ fontSize: small.px, color: muted }}>{state}</div>
                <input
                  readOnly
                  className="ds-input"
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
                    ...(state === "focus" ? asStyle(controls.focusRing) : {}),
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {pairs.map((pair) => (
            <div key={pair.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <div className="text-sm">{pair.label}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {pair.foreground} on {pair.background} · {pair.levels.ratio.toFixed(2)}:1
                </div>
              </div>
              <PassBadge passes={pair.passes} required={pair.required} />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Radio, checkbox and switch"
        description="The same states as inputs, with the same focus ring and the same input border."
      >
        <div className="overflow-x-auto" style={stage}>
          <div className="grid min-w-[40rem] items-center gap-x-3 gap-y-4" style={{ gridTemplateColumns: "6rem repeat(6, 1fr)" }}>
            <div />
            {SELECTION_STATES.map((state) => (
              <div key={state} className="text-xs" style={{ color: muted }}>
                {state}
              </div>
            ))}
            {SELECTION_CONTROLS.map((control) => (
              <div key={control} className="contents">
                <div className="text-xs" style={{ color: muted }}>
                  {control}
                </div>
                {SELECTION_STATES.map((state) => (
                  <Labelled key={state} label="Label" muted={state === "disabled"}>
                    <SelectionPreview control={control} state={state} />
                  </Labelled>
                ))}
              </div>
            ))}
          </div>
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
    </div>
  );
}
