import type { Metadata } from "next";
import { ExportScreen } from "@/components/export/export-screen";
import { baseMetadata } from "@/lib/site";

// The Export screen is part of the tool: findable through /app, not listed on its own.
export const metadata: Metadata = baseMetadata("Plinth: export your design system", { path: "/app/export", index: false });

export default function ExportPage() {
  return <ExportScreen />;
}
