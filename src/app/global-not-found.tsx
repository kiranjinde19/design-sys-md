import type { Metadata } from "next";
import "./globals.css";
import { fontClasses } from "@/components/landing/fonts";
import { NotFoundView } from "@/components/site/status-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: `${SITE.name}: page not found` };

/** The 404 page for every address that matches no route. The app has two root layouts, so it needs a page that brings its own html. */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${fontClasses} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NotFoundView />
      </body>
    </html>
  );
}
