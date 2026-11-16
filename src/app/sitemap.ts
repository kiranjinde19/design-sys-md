import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** The landing page and the tool. (The Export screen belongs to the tool and is not listed on its own.) */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [{ url: new URL("/", base).toString() }, { url: new URL("/app", base).toString() }];
}
