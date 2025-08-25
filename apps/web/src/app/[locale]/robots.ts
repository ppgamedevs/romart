import { MetadataRoute } from "next";

export default async function robots({ params }: { params: Promise<{ locale: string }> }): Promise<MetadataRoute.Robots> {
  const { locale } = await params;
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
    sitemap: `${baseUrl}/${locale}/sitemap.xml`
  };
}
