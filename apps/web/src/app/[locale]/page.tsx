import type { Metadata } from "next";
import { dict, t as T } from "@/components/i18n/t";
import HomeHero from "@/components/home/HomeHero";
import { ArtworkRail, CollectionsRail } from "@/components/home/Rail";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 900; // 15 min

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = process.env.SITE_NAME || "Art from Romania";
  const baseUrl = "http://localhost:3000";
  return {
    title,
    description: "Buy curated Romanian art — paintings, drawings, photography, digital.",
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        ro: `${baseUrl}/ro`
      }
    },
    openGraph: { title, url: `${baseUrl}/${locale}` }
  };
}

async function fetchHome() {
  try {
    const r = await fetch("http://localhost:3000/api/home-feed", { 
      next: { revalidate: 900 }
    });
    if (!r.ok) return { collections: [], trending: [], newest: [], underPrice: [] };
    return r.json();
  } catch (error) {
    console.error("Failed to fetch home feed:", error);
    return { collections: [], trending: [], newest: [], underPrice: [] };
  }
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = T(locale);
  
  // Fetch home data
  const { collections, trending, newest, underPrice } = await fetchHome();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <HomeHero t={t} locale={locale} />
      
      <CollectionsRail 
        title={t("featuredCollections")} 
        items={collections} 
        locale={locale} 
      />
      
      <ArtworkRail 
        title={t("trendingNow")} 
        items={trending} 
        locale={locale} 
      />
      
      <ArtworkRail 
        title={t("newArrivals")} 
        items={newest} 
        locale={locale} 
      />
      
      <ArtworkRail 
        title={t("under500")} 
        items={underPrice} 
        locale={locale} 
      />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Art from Romania",
          "description": "Buy curated Romanian art — paintings, drawings, photography, digital.",
          "url": "http://localhost:3000",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "http://localhost:3000/discover?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }}
      />
    </div>
  );
}
