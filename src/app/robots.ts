import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Everything may be crawled; the sitemap lists the two pages that matter. No tracking of any kind. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: new URL("/sitemap.xml", siteUrl()).toString() };
}
