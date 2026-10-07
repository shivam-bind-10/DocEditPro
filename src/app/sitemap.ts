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

  const extraPages = [
    "/pdf-editor",
    "/guides",
    "/batch-queue",
    "/signature-library",
    "/fill-form",
    "/bates-numbering",
    "/pdf-a",
  ].map((slug) => ({
    url: `${baseUrl}${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    ...toolPages,
    ...extraPages,
  ];
}
