"use client";

import type { CSSProperties } from "react";
import {
  SIGNATURE_CATALOG,
  useDesignSystem,
  type CssRecipe,
} from "@/lib/design-system";
import { Section } from "./section";

const asStyle = (recipe: CssRecipe) => recipe as CSSProperties;

export function DebugSignature() {
  const { tokens } = useDesignSystem();
  const { controls, colors, typography, borders, signature, icons, spacing, radius } = tokens;
  const body = typography.sizes.find((size) => size.name === "base")!;
  const small = typography.sizes.find((size) => size.name === "sm")!;
  const stage: CSSProperties = {
    background: colors.roles.background,
    color: colors.roles.foreground,
    fontFamily: typography.body.previewStack,
    fontSize: body.px,
    border: `${borders.width}px solid ${borders.color}`,
    borderRadius: radius.lg,
    padding: spacing.semantic.cardPadding,
  };
  const cta = signature.primaryCta;

  return (
    <>
      <Section title="Signature details" description="The seven chosen moves, shown on small samples.">
        {cta.stylesheet ? <style>{cta.stylesheet}</style> : null}
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
              className={cta.className ?? undefined}
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
            <div style={{ color: colors.roles["muted-foreground"], fontSize: small.px }}>
              Above
              <div style={asStyle(signature.divider.css)} />
              Below
            </div>
          </Sample>
        </div>
        {cta.stylesheet ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Primary CTA CSS (with reduced-motion fallback)</h3>
            <pre className="overflow-x-auto rounded-lg border border-border p-4 font-mono text-xs leading-relaxed">
              {cta.stylesheet}
            </pre>
            <p className="text-xs text-muted-foreground">
              To test: turn on &quot;Reduce motion&quot; in your computer&apos;s accessibility settings and reload. The glow stops
              pulsing and stays on as a steady border.
            </p>
          </div>
        ) : null}
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
      <div className="text-xs" style={{ color: tokens.colors.roles["muted-foreground"] }}>
        {label}
      </div>
      {children}
    </div>
  );
}
