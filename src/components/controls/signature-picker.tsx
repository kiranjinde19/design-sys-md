"use client";

import type { CSSProperties, ReactNode } from "react";
import { SIGNATURE_CATALOG, useDesignSystem, type SignatureSettings } from "@/lib/design-system";
import { TAB_FOR_SIGNATURE, setPreviewTab } from "@/components/app/preview-tab";
import { cn } from "@/lib/utils";

type Key = keyof SignatureSettings;

/** A small drawing of one option, in the user's own brand color. It is a sample, like the board tiles. */
function Visual({ category, id }: { category: Key; id: string }) {
  const { tokens } = useDesignSystem();
  const { brand, neutral, brandReport, roles } = tokens.colors;
  const ui = brandReport.ui;
  const line = neutral[300];
  const card = (style: CSSProperties, children?: ReactNode) => (
    <div style={{ width: 38, height: 26, borderRadius: 4, background: "#fff", position: "relative", ...style }}>{children}</div>
  );
  const star = (color: string) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
  const button = (style: CSSProperties) => <div style={{ width: 44, height: 20, borderRadius: 4, background: roles.primary, ...style }} />;

  switch (`${category}:${id}`) {
    // Featured highlight
    case "featuredHighlight:crisp-border":
      return card({ border: `2px solid ${ui}` });
    case "featuredHighlight:offset-shadow":
      return card({ border: `1px solid ${roles.foreground}`, boxShadow: `4px 4px 0 ${ui}` });
    case "featuredHighlight:solid-accent-fill":
      return card({ background: roles.primary, border: `1px solid ${roles.primary}` });
    case "featuredHighlight:corner-ribbon":
      return card(
        { border: `1px solid ${brand[500]}`, overflow: "hidden" },
        <span style={{ position: "absolute", top: 0, right: 0, width: 14, height: 14, background: ui, clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />,
      );
    // Card style
    case "cardStyle:hairline-border":
      return card({ border: `1px solid ${line}` });
    case "cardStyle:soft-shadow":
      return card({ boxShadow: "0 4px 10px rgb(0 0 0 / 0.16)" });
    case "cardStyle:tinted-bento-tile":
      return card({ background: brand[50], border: `1px solid ${brand[100]}` });
    case "cardStyle:glass-blur":
      return (
        <div style={{ position: "relative", width: 50, height: 32 }}>
          <span style={{ position: "absolute", left: 2, top: 2, width: 20, height: 20, borderRadius: 9999, background: brand[400] }} />
          <span style={{ position: "absolute", right: 2, bottom: 2, width: 18, height: 18, borderRadius: 9999, background: brand[200] }} />
          <div style={{ position: "absolute", left: 6, top: 4, width: 38, height: 24, borderRadius: 4, background: "rgb(255 255 255 / 0.45)", backdropFilter: "blur(4px)", border: "1px solid rgb(255 255 255 / 0.8)" }} />
        </div>
      );
    // Hover
    case "hover:lift-2px":
      return (
        <div style={{ display: "grid", justifyItems: "center", gap: 3 }}>
          {card({ border: `1px solid ${line}`, transform: "translateY(-3px)", boxShadow: "0 3px 6px rgb(0 0 0 / 0.14)" })}
          <span style={{ width: 28, height: 3, borderRadius: 9999, background: "rgb(0 0 0 / 0.14)" }} />
        </div>
      );
    case "hover:border-color-shift":
      return card({ border: `2px solid ${ui}` });
    case "hover:scale-1-02":
      return (
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", inset: -5, border: `1px dashed ${neutral[500]}`, borderRadius: 6 }} />
          {card({ border: `1px solid ${line}` })}
        </div>
      );
    case "hover:background-tint":
      return card({ background: brand[50], border: `1px solid ${line}` });
    // Primary call to action
    case "primaryCta:solid":
      return button({});
    case "primaryCta:border-beam":
      return (
        <div
          className="sig-beam"
          style={{ ["--sw-ring" as string]: brand[400], ["--sw-head" as string]: brand[100], ["--sw-tail" as string]: brand[400], ["--sw-fill" as string]: roles.primary } as CSSProperties}
        >
          <i />
        </div>
      );
    case "primaryCta:gradient-fill":
      return button({ background: `linear-gradient(180deg, ${brand[500]}, ${brand[700]})` });
    case "primaryCta:underline-sweep":
      return (
        <div className="sig-sweep" style={{ color: brand[700] }}>
          <span style={{ fontSize: 12, fontWeight: 600, lineHeight: "16px" }}>Button</span>
          <i />
        </div>
      );
    // Icon container
    case "iconContainer:bare":
      return star(brand[700]);
    case "iconContainer:tinted-circle":
      return <div style={{ width: 28, height: 28, borderRadius: 9999, background: brand[100], display: "grid", placeItems: "center" }}>{star(brand[700])}</div>;
    case "iconContainer:rounded-square-tile":
      return <div style={{ width: 28, height: 28, borderRadius: 7, background: brand[100], display: "grid", placeItems: "center" }}>{star(brand[700])}</div>;
    case "iconContainer:outlined-badge":
      return <div style={{ width: 28, height: 28, borderRadius: 9999, border: `1.5px solid ${ui}`, display: "grid", placeItems: "center" }}>{star(brand[700])}</div>;
    // Focus ring
    case "focusRing:offset-ring":
      return button({ width: 36, height: 18, boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${ui}` });
    case "focusRing:soft-ring":
      return button({ width: 36, height: 18, boxShadow: `0 0 0 4px color-mix(in srgb, ${ui} 35%, transparent)` });
    case "focusRing:thick-outline":
      return button({ width: 36, height: 18, outline: `3px solid ${ui}`, outlineOffset: 0 });
    // Divider
    case "divider:hairline":
      return <Divider top={<div style={{ borderTop: `1px solid ${neutral[400]}` }} />} />;
    case "divider:dotted":
      return <Divider top={<div style={{ borderTop: `2px dotted ${neutral[500]}` }} />} />;
    case "divider:spacing-only":
      return <Divider top={<div style={{ height: 8 }} />} />;
    case "divider:gradient-fade":
      return <Divider top={<div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${neutral[500]}, transparent)` }} />} />;
    default:
      return null;
  }
}

function Divider({ top }: { top: ReactNode }) {
  const { tokens } = useDesignSystem();
  const block = <span style={{ display: "block", height: 6, width: 40, borderRadius: 2, background: tokens.colors.neutral[200] }} />;
  return (
    <div style={{ display: "grid", gap: 3, justifyItems: "stretch", width: 52 }}>
      {block}
      {top}
      {block}
    </div>
  );
}

/**
 * Every Signature details category as a row of small drawings, each with its name written below it (no hover needed, so it
 * works on a phone too). Choosing one also opens the preview tab where it can be seen.
 */
export function SignaturePicker() {
  const { settings, update } = useDesignSystem();
  return (
    <div className="flex flex-col gap-6">
      {(Object.keys(SIGNATURE_CATALOG) as Key[]).map((key) => {
        const category = SIGNATURE_CATALOG[key];
        const options = category.options as { id: string; label: string; description: string }[];
        const value = settings.signature[key] as string;
        return (
          <fieldset key={key} className="m-0 min-w-0 space-y-2 border-0 p-0" data-signature={key}>
            <legend className="mb-2 p-0 text-sm font-medium leading-5">{category.label}</legend>
            <div className="grid grid-cols-4 items-stretch gap-2">
              {options.map((option) => {
                const selected = option.id === value;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    data-option={option.id}
                    title={option.description}
                    onClick={() => {
                      update({ signature: { [key]: option.id } as Partial<SignatureSettings> });
                      setPreviewTab(TAB_FOR_SIGNATURE[key] ?? "Pricing");
                    }}
                    className={cn(
                      "sig-tile flex min-h-[84px] min-w-0 flex-col items-center justify-start gap-2 rounded-[10px] border bg-card px-1 pb-2 pt-3 transition-colors hover:border-foreground",
                      selected ? "border-2 border-foreground px-[3px] pb-[7px] pt-[11px]" : "border-border",
                    )}
                  >
                    <span className="flex h-10 items-center justify-center">
                      <Visual category={key} id={option.id} />
                    </span>
                    <span className={cn("text-center text-xs leading-4", selected ? "font-medium text-foreground" : "text-muted-foreground")}>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
