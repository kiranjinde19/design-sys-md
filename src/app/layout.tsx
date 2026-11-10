import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DesignSystemProvider } from "@/lib/design-system";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Design Sys.md",
  description: "Build your brand design system and teach your AI to use it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DesignSystemProvider>{children}</DesignSystemProvider>
      </body>
    </html>
  );
}
