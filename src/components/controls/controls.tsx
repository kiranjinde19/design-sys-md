"use client";

/**
 * Small building blocks for every editor: a labelled field, a slider, a row of choices and a color box.
 * Used by /debug and by the tool screen at /app, so a control is written once.
 */

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeHex } from "@/lib/design-system";

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

export function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={`${label}: ${value}`}>
      <input
        type="range"
        className="w-full accent-primary"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}

/** A small toggle button. The selected one gets a crisp 2px brand border instead of a filled primary look, so a screen keeps a single primary button. */
export function ChoiceButton({ selected, className, ...props }: { selected: boolean } & React.ComponentProps<typeof Button>) {
  return <Button size="sm" variant="outline" aria-pressed={selected} className={cn(selected && "border-2 border-primary font-medium", className)} {...props} />;
}

/**
 * One segmented control style everywhere: a muted container with 10px radius and 4px padding, 32px
 * buttons with 5px radius, and the selected one lifted onto the page color with the extra small shadow.
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  labelFor = String,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  labelFor?: (option: T) => string;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full flex-wrap gap-0.5 rounded-[10px] bg-muted p-1">
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option)}
            className={cn(
              "h-8 rounded-[5px] px-3 text-sm font-medium whitespace-nowrap transition-colors",
              selected ? "bg-background text-foreground shadow-[var(--t-shadow-xs,0_1px_2px_rgb(0_0_0/0.08))]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {labelFor(option)}
          </button>
        );
      })}
    </div>
  );
}

export function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
  labelFor = String,
  segmented = true,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  /** Turns an option into the words on its button. */
  labelFor?: (option: T) => string;
  /** A short row of exclusive choices is a segmented control. Long or wrapping lists use separate buttons. */
  segmented?: boolean;
}) {
  if (segmented) {
    return (
      <Field label={label}>
        <Segmented label={label} options={options} value={value} onChange={onChange} labelFor={labelFor} />
      </Field>
    );
  }
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <ChoiceButton key={option} selected={option === value} onClick={() => onChange(option)}>
            {labelFor(option)}
          </ChoiceButton>
        ))}
      </div>
    </Field>
  );
}

/** A color picker plus a hex box. Only valid hex codes are applied while typing. */
export function HexColorField({ label, value, onCommit }: { label: string; value: string; onCommit: (hex: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`Pick ${label.toLowerCase()}`}
          className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
          value={value.toLowerCase()}
          onChange={(event) => onCommit(event.target.value)}
        />
        <input
          type="text"
          aria-label={`${label} hex code`}
          className="h-9 w-28 rounded-md border border-border bg-background px-3 font-mono text-sm"
          value={draft ?? value}
          onChange={(event) => {
            setDraft(event.target.value);
            const valid = normalizeHex(event.target.value);
            if (valid) onCommit(valid);
          }}
          onBlur={() => setDraft(null)}
          spellCheck={false}
        />
      </div>
      {draft !== null && !normalizeHex(draft) ? <p className="text-xs text-destructive">Use a hex code like #4F46E5</p> : null}
    </Field>
  );
}
