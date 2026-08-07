import type { MetadataRoute } from "next";
import { firm } from "@/config/firm";
import { sectionDefs } from "@/lib/content/sections";

/** Every public page. Section pages carry real guidance copy, so they index. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const url = (path: string) => `${firm.appUrl}${path}`;

  return [
    { url: url("/"), lastModified, changeFrequency: "monthly", priority: 1 },
    { url: url("/letter/getting-started"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...sectionDefs
      .filter((s) => s.slug !== "getting-started")
      .map((s) => ({
        url: url(`/letter/${s.slug}`),
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    { url: url("/letter/review"), lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: url("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: url("/your-data"), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
