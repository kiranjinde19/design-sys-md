import type { Metadata } from "next";
import { ToolScreen } from "@/components/app/tool-screen";

export const metadata: Metadata = {
  title: "Plinth: build your design system",
};

export default function AppPage() {
  return <ToolScreen />;
}
