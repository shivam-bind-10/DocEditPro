import { Metadata } from "next";
import { TOOLS } from "@/lib/tools-data";

const APP_URL = "https://doceditpro.vercel.app";

/**
 * Returns Next.js Metadata for a given tool slug.
 * Used by individual tool route layout.tsx files.
 */
export function generateToolMetadata(slug: string): Metadata {
  const tool = TOOLS.find((t) => t.slug === slug);

  if (!tool) {
    return {
      title: "DocEditPro — PDF Tools",
      description:
        "Privacy-first, browser-based PDF toolkit. 44 tools, 100% client-side.",
    };
  }

  const title = `${tool.name} — Free Online PDF Tool | DocEditPro`;
  const description = `${tool.description} No sign-up, no watermarks, no file uploads — runs 100% in your browser.`;
  const canonical = `${APP_URL}/${tool.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "DocEditPro",
      title,
      description,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@doceditpro",
    },
  };
}
