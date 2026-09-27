import { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://doceditpro.vercel.app";
  const now = new Date();

  const toolPages = TOOLS.map((tool) => ({
    url: `${baseUrl}/${tool.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: tool.popular ? 0.9 : 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...toolPages,
  ];
}
