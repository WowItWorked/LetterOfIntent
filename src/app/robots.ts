import type { MetadataRoute } from "next";
import { firm } from "@/config/firm";

/**
 * The whole point of this tool is to be findable by families who need it,
 * so everything is crawlable. There is nothing private to hide from crawlers:
 * user data never leaves the browser, so no page can ever contain it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${firm.appUrl}/sitemap.xml`,
  };
}
