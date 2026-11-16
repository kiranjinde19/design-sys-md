import type { Metadata } from "next";
import "../globals.css";
import { baseMetadata } from "@/lib/site";
import { fontClasses } from "@/components/landing/fonts";

export const metadata: Metadata = baseMetadata("Plinth");

/**
 * Applies the saved light or dark choice before the first paint, so a returning visitor never sees the wrong theme for a
 * moment. It reads the same saved choice the tool uses and sets it on <html> (the page's CSS reads it from there). With no
 * saved choice nothing is set and the system setting decides. Inline, about 170 bytes, no request.
 */
const THEME_SCRIPT = 'try{var t=localStorage.getItem("design-sys-md:tool-theme");if(t==="dark"||t==="light"){var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t}}catch(e){}';

/** The root layout for the landing page: its own fonts, and nothing from the tool (no saved design system, no Inter). */
export default function SiteRootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontClasses} h-full antialiased`} style={{ ["--font-inter" as string]: "var(--f-page)" }} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
