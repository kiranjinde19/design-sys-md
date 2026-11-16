import type { Metadata } from "next";

/** Names and texts shared by the landing page and the tool: page title, description, share cards. */
export const SITE = {
  name: "Plinth",
  description: "Plinth builds your brand design system and turns it into one SKILL.md or AGENTS.md file for Claude Code, Codex and ChatGPT. Free, no login.",
  tagline: "Are you building a solid app? Here is your first stone for the foundation.",
  appDescription: "Build your brand design system with sliders, pickers and drag and drop, then download one SKILL.md or AGENTS.md file for Claude Code, Codex and ChatGPT. Free, no login, runs in your browser.",
} as const;

/** The share image for link previews (Open Graph and Twitter cards), 1200 by 630. */
const SHARE_IMAGE = { url: "/brand/plinth-share.png", width: 1200, height: 630, alt: `${SITE.name}. ${SITE.tagline}` };

/**
 * The public address, so canonical links, the sitemap and share images are absolute. NEXT_PUBLIC_SITE_URL wins; otherwise
 * Vercel's production domain is used; otherwise (a local build) it is localhost.
 */
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const raw = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
}

/** Metadata every page starts from. A page adds its own title, description and canonical path. */
export function baseMetadata(title: string = SITE.name, options: { description?: string; path?: string; index?: boolean } = {}): Metadata {
  const description = options.description ?? SITE.description;
  return {
    metadataBase: siteUrl(),
    title,
    description,
    ...(options.path ? { alternates: { canonical: options.path } } : {}),
    ...(options.index === false ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, siteName: SITE.name, type: "website", ...(options.path ? { url: options.path } : {}), images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE] },
  };
}
