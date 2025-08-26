import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL || "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/discover", "/artist/", "/artwork/"],
        disallow: [
          "/admin", "/studio", "/dashboard", "/api", "/sign-in", "/sign-out",
          "/styleguide"
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
