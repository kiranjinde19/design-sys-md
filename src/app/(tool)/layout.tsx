import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { DesignSystemProvider } from "@/lib/design-system";
import { baseMetadata } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = baseMetadata("Plinth");

/** The root layout for the tool (/app) and the review pages: the tool's font and the saved design system. */
export default function ToolRootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <DesignSystemProvider>{children}</DesignSystemProvider>
      </body>
    </html>
  );
}
