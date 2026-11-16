import type { Metadata } from "next";
import "../globals.css";
import { DesignSystemProvider } from "@/lib/design-system";
import { baseMetadata } from "@/lib/site";

export const metadata: Metadata = baseMetadata("Plinth");

/** Inter, from this site's own files (public/fonts, see scripts/fetch-fonts.mjs): the tool's text and the default font of every design. */
const INTER = 'Inter, "Inter Fallback", ui-sans-serif, system-ui, sans-serif';

/** The root layout for the tool (/app) and its pages: the tool's font and the saved design system. */
export default function ToolRootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" style={{ ["--font-inter" as string]: INTER }}>
      <head>
        {/* The only font a first visit needs. Its file is preloaded; every other font loads only when it is picked or the picker opens. */}
        <link rel="preload" href="/fonts/files/inter-var-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* A plain stylesheet link on purpose: the file is a static copy in public/fonts, not something the bundler builds. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/fonts/css/inter.css" precedence="default" />
      </head>
      <body className="min-h-full flex flex-col">
        <DesignSystemProvider>{children}</DesignSystemProvider>
      </body>
    </html>
  );
}
