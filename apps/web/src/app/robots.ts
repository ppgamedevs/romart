import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://artfromromania.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/studio/",
          "/admin/",
          "/api/",
          "/account/",
          "/sign-in",
          "/sign-up",
          "/checkout/"
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
