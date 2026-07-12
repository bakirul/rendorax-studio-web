import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/access",
        "/private-reel",
        "/checklist",
      ],
    },
    sitemap: "https://www.rendorax.com/sitemap.xml",
  };
}
