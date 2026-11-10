"use client";

import type { ReactNode } from "react";
import { useDesignSystem } from "@/lib/design-system";

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Pass or fail at the ratio a pair needs, colored with the design system's own semantic colors. */
export function PassBadge({ passes, required }: { passes: boolean; required: number }) {
  const { tokens } = useDesignSystem();
  const tone = passes ? tokens.colors.semantic.success : tokens.colors.semantic.error;
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: tone[100], color: tone[800] }}
    >
      {passes ? "Pass" : "Fail"} {required}:1
    </span>
  );
}
