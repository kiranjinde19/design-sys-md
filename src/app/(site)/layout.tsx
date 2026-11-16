import type { Metadata } from "next";
import "../globals.css";
import { baseMetadata } from "@/lib/site";
import { fontClasses } from "@/components/landing/fonts";

export const metadata: Metadata = baseMetadata("Plinth");

/** The root layout for the landing page: its own fonts, and nothing from the tool (no saved design system, no Inter). */
export default function SiteRootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontClasses} h-full antialiased`} style={{ ["--font-inter" as string]: "var(--f-page)" }}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
