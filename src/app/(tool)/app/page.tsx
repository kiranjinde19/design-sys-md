import type { Metadata } from "next";
import { ToolScreen } from "@/components/app/tool-screen";
import { SITE, baseMetadata } from "@/lib/site";

export const metadata: Metadata = baseMetadata("Plinth: build your design system", { description: SITE.appDescription, path: "/app" });

export default function AppPage() {
  return <ToolScreen />;
}
