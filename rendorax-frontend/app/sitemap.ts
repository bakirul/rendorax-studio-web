import { MetadataRoute } from "next";

const BASE_URL = "https://www.rendorax.com";

const SERVICE_SLUGS = [
  "broadcast-editing",
  "web-series-drama",
  "corporate-commercial",
  "animation-dub",
  "audio-mastering",
  "color-grading",
  "motion-vfx",
  "archival-restoration",
  "podcast-editing",
] as const;

const JOURNAL_SLUGS = [
  "broadcast-loudness-standard",
  "master-export-guide",
  "automation-comfyui-n8n",
  "archival-restoration",
] as const;

const PORTFOLIO_SLUGS = [
  "heroic-archives",
  "voiced-classics",
  "rendorax-media-reel",
  "aurastream",
  "rendoraxfit",
  "pawprints-in-silence",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/studio`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/portfolio`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/journal`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/career`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/affiliate`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/refund`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/podcast`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guide`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...SERVICE_SLUGS.map((slug) => ({
      url: `${BASE_URL}/services/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...JOURNAL_SLUGS.map((slug) => ({
      url: `${BASE_URL}/journal/${slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...PORTFOLIO_SLUGS.map((slug) => ({
      url: `${BASE_URL}/portfolio/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
