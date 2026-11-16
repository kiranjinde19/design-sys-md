import type { Metadata } from "next";

/** Names and texts shared by the landing page and the tool: page title, description, share cards. */
export const SITE = {
  name: "Plinth",
  description: "Plinth builds your brand design system and turns it into one SKILL.md or AGENTS.md file for Claude Code, Codex and ChatGPT. Free, no login.",
  tagline: "Are you building a solid app? Here is your first stone for the foundation.",
} as const;

/** The share image for link previews (Open Graph and Twitter cards), 1200 by 630. */
const SHARE_IMAGE = { url: "/brand/plinth-share.png", width: 1200, height: 630, alt: `${SITE.name}. ${SITE.tagline}` };

/** The public address, so share images get absolute links. Set NEXT_PUBLIC_SITE_URL to override; Vercel's production domain is used when present. */
function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(explicit ?? (vercel ? `https://${vercel}` : "http://localhost:3000"));
}

/** Metadata every page starts from. Pages add their own title. */
export function baseMetadata(title: string = SITE.name): Metadata {
  return {
    metadataBase: siteUrl(),
    title,
    description: SITE.description,
    openGraph: { title, description: SITE.description, siteName: SITE.name, type: "website", images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description: SITE.description, images: [SHARE_IMAGE] },
  };
}
