import type { Metadata } from "next";
import { DebugView } from "@/components/debug/debug-view";

export const metadata: Metadata = {
  title: "Token engine debug",
  robots: { index: false },
};

export default function DebugPage() {
  return <DebugView />;
}
