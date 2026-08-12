import type { MetadataRoute } from "next";
import { firm } from "@/config/firm";
import { allSectionSlugs } from "@/lib/content/config";

/** Every public page. Section pages carry real guidance copy, so they index. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const url = (path: string) => `${firm.appUrl}${path}`;

  return [
    { url: url("/"), lastModified, changeFrequency: "monthly", priority: 1 },
    { url: url("/letter"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    {
      url: url("/letter-of-intent"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: url("/letter-for-the-caregiver"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...allSectionSlugs().map((slug) => ({
      url: url(`/letter/${slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: slug === "getting-started" ? 0.8 : 0.7,
    })),
    { url: url("/letter/review"), lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: url("/care-cards"), lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: url("/emergency-sheet"), lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: url("/fillable-forms"), lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: url("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: url("/your-data"), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
