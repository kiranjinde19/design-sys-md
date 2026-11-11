"use client";

import type { LucideIcon } from "lucide-react";
import { useDesignSystem } from "@/lib/design-system";

/**
 * Every icon in the preview goes through this one component, so the chosen icon style (outline, solid,
 * duotone), stroke width and line ends reach all of them.
 */
export function PvIcon({ icon: Icon, size = 16, className }: { icon: LucideIcon; size?: number; className?: string }) {
  const { icons } = useDesignSystem().tokens;
  return (
    <Icon
      aria-hidden
      width={size}
      height={size}
      className={className}
      strokeWidth={icons.strokeWidth}
      strokeLinecap={icons.strokeLinecap}
      strokeLinejoin={icons.strokeLinejoin}
      // Solid fills the shapes; duotone fills them with a pale copy of the line color.
      fill={icons.style === "outline" ? "none" : "currentColor"}
      fillOpacity={icons.style === "duotone" ? icons.duotoneOpacity : 1}
    />
  );
}
