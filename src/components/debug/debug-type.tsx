"use client";

import { useDesignSystem } from "@/lib/design-system";
import { Section } from "./section";

export function DebugType() {
  const { tokens } = useDesignSystem();
  const { typography, colors } = tokens;

  return (
    <Section
      title="Typography"
      description={`Heading: ${typography.heading.name}, body: ${typography.body.name}. Base ${typography.baseSize}px, ratio ${typography.scaleRatio}, body line height ${typography.bodyLineHeight}. Only Inter is loaded in this app so far.`}
    >
      <div className="divide-y divide-border rounded-xl border border-border">
        {[...typography.sizes].reverse().map((size) => {
          const isHeading = size.step >= 2;
          return (
            <div key={size.name} className="grid items-baseline gap-2 p-4 sm:grid-cols-[10rem_1fr]">
              <div className="font-mono text-xs text-muted-foreground">
                {size.name} · {size.px}px
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
      <p className="text-sm text-muted-foreground">
        Weights: regular {typography.weights.regular}, medium {typography.weights.medium}, semibold{" "}
        {typography.weights.semibold}, bold {typography.weights.bold}.
      </p>
    </Section>
  );
}
