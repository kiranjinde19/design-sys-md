"use client";

import { WEIGHT_LABELS, useDesignSystem, type FontToken } from "@/lib/design-system";
import { Section } from "./section";

/** Rows of numbers, once with default digits and once with tabular digits, to show the difference. */
const NUMBER_ROWS = [
  { label: "Revenue", value: "$11,111.00" },
  { label: "Refunds", value: "$1,087.50" },
  { label: "Net", value: "$10,023.50" },
];

function FontRow({ font }: { font: FontToken }) {
  return (
    <div className="grid gap-1 p-4 sm:grid-cols-[8rem_1fr]">
      <div className="text-xs font-medium capitalize">{font.role}</div>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">{font.name}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {font.source === "brand" ? "Licensed brand font" : "Google font"}
          </span>
          <span className="text-xs text-muted-foreground">{font.category}</span>
          {font.fallbackName ? (
            <span className="text-xs text-muted-foreground">fallback and preview: {font.fallbackName}</span>
          ) : null}
        </div>
        <div className="font-mono text-xs text-muted-foreground">{font.stack}</div>
        <div className="text-xs text-muted-foreground">
          Offers {font.offeredWeights.join(", ")}
        </div>
      </div>
    </div>
  );
}

export function DebugType() {
  const { tokens } = useDesignSystem();
  const { typography, colors } = tokens;
  const body = typography.sizes.find((size) => size.name === "base")!;
  const small = typography.sizes.find((size) => size.name === "sm")!;
  const headingSize = typography.sizes.find((size) => size.name === "3xl")!;
  const monoFont = typography.mono;

  return (
    <div className="space-y-10">
      <Section
        title="Fonts in use"
        description="Complete CSS stacks with system fallbacks, so text never goes blank while a font loads."
      >
        <div className="divide-y divide-border rounded-xl border border-border">
          <FontRow font={typography.heading} />
          <FontRow font={typography.body} />
          {monoFont ? (
            <FontRow font={monoFont} />
          ) : (
            <div className="grid gap-1 p-4 sm:grid-cols-[8rem_1fr]">
              <div className="text-xs font-medium">Mono</div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">None chosen. Code uses the system monospace stack.</div>
                <div className="font-mono text-xs text-muted-foreground">{typography.stacks.mono}</div>
              </div>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Heading weight {typography.headingWeight} ({WEIGHT_LABELS[typography.headingWeight]}), body weight{" "}
          {typography.bodyWeight} ({WEIGHT_LABELS[typography.bodyWeight]}), heading tracking {typography.headingTracking}em.
          Component weights: regular {typography.weights.regular}, medium {typography.weights.medium}, semibold{" "}
          {typography.weights.semibold}, bold {typography.weights.bold}.
        </p>
        {typography.warnings.length > 0 ? (
          <div className="space-y-1 rounded-lg p-3 text-sm" style={{ background: colors.semantic.warning[100], color: colors.semantic.warning[800] }}>
            {typography.warnings.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="Heading and body sample">
        <div className="space-y-3 rounded-xl border border-border p-5" style={{ background: colors.roles.background }}>
          <div
            style={{
              fontFamily: typography.heading.previewStack,
              fontWeight: typography.headingWeight,
              fontSize: headingSize.px,
              lineHeight: headingSize.lineHeight,
              letterSpacing: headingSize.letterSpacing,
              color: colors.roles.foreground,
            }}
          >
            Stop shipping random blues and mismatched buttons.
          </div>
          <p
            style={{
              fontFamily: typography.body.previewStack,
              fontWeight: typography.bodyWeight,
              fontSize: body.px,
              lineHeight: body.lineHeight,
              color: colors.roles["muted-foreground"],
            }}
          >
            Teach your AI your brand first, so every screen it builds looks like one product.
          </p>
          {monoFont ? (
            <code style={{ fontFamily: monoFont.previewStack, fontSize: small.px, color: colors.roles.foreground }}>
              npm run build --prefix design-system
            </code>
          ) : null}
        </div>
      </Section>

      <Section
        title="Type scale"
        description={`Base ${typography.baseSize}px, ratio ${typography.scaleRatio}, body line height ${typography.bodyLineHeight}. Whole pixel sizes, 12px minimum. Tracking applies to headings only.`}
      >
        <div className="divide-y divide-border rounded-xl border border-border">
          {[...typography.sizes].reverse().map((size) => {
            const isHeading = size.step >= 2;
            return (
              <div key={size.name} className="grid items-baseline gap-2 p-4 sm:grid-cols-[10rem_1fr]">
                <div className="font-mono text-xs text-muted-foreground">
                  {size.name} · {size.px}px · {size.rem}rem
                  <br />
                  lh {size.lineHeight} · ls {size.letterSpacing}
                </div>
                <div
                  className="truncate"
                  style={{
                    fontFamily: isHeading ? typography.heading.previewStack : typography.body.previewStack,
                    fontWeight: isHeading ? typography.headingWeight : typography.bodyWeight,
                    fontSize: size.px,
                    lineHeight: size.lineHeight,
                    letterSpacing: size.letterSpacing,
                    color: colors.roles.foreground,
                  }}
                >
                  Stop shipping random blues
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Tabular numbers" description={typography.tabularNumbers.usage}>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Default digits", css: {} },
            { title: `Tabular digits (${typography.tabularNumbers.className})`, css: typography.tabularNumbers.css },
          ].map((variant) => (
            <div key={variant.title} className="space-y-2 rounded-xl border border-border p-4">
              <div className="text-xs font-medium text-muted-foreground">{variant.title}</div>
              {NUMBER_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between"
                  style={{ fontFamily: typography.body.previewStack, fontSize: body.px, color: colors.roles.foreground }}
                >
                  <span>{row.label}</span>
                  <span style={variant.css as React.CSSProperties}>{row.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          font-variant-numeric: tabular-nums · Tailwind class: {typography.tabularNumbers.className}
        </p>
      </Section>
    </div>
  );
}
