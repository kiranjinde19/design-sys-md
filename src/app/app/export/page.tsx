import type { Metadata } from "next";
import { ExportScreen } from "@/components/export/export-screen";

export const metadata: Metadata = {
  title: "Design Sys.md: export your design system",
};

export default function ExportPage() {
  return <ExportScreen />;
}
