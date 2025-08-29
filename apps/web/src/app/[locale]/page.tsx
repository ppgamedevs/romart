import type { Metadata } from "next";
import { dict, t as T } from "@/components/i18n/t";
import HomeHero from "@/components/home/HomeHero";
import { ArtworkRail, CollectionsRail } from "@/components/home/Rail";


export const revalidate = 900; // 15 min

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const base = process.env.SITE_URL || "http://localhost:3000";
  const title = process.env.SITE_NAME || "Art from Romania";
  return {
    title,
    description: "Buy curated Romanian art — paintings, drawings, photography, digital.",
    alternates: {
      canonical: `${base}/${locale}`,
      languages: {
        en: `${base}/en`,
        ro: `${base}/ro`
      }
    },
    openGraph: { title, url: `${base}/${locale}` }
  };
}

async function fetchHome() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const r = await fetch(`${baseUrl}/api/home-feed`, { next: { revalidate: 900 } });
  if (!r.ok) return { collections: [], trending: [], newest: [], underPrice: [] };
  return r.json();
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = T(locale);
  const data = await fetchHome();

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": process.env.SITE_NAME || "Art from Romania",
    "url": process.env.SITE_URL || "http://localhost:3000",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${process.env.SITE_URL || "http://localhost:3000"}/${locale}/discover?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const underLabel = locale === "ro" ? "500 €" : "€500";

  return (
    <div className="max-w-6xl mx-auto p-6">
      <HomeHero t={t} locale={locale} />

      <CollectionsRail title={t("featuredCollections")} items={data.collections} locale={locale} />
      <ArtworkRail title={t("trendingNow")} items={data.trending} locale={locale} />
      <ArtworkRail title={t("newArrivals")} items={data.newest} locale={locale} />
      <ArtworkRail title={t("underPrice", underLabel)} items={data.underPrice} locale={locale} />

      {/* SEO copy — sub fold */}
      <section className="mt-10 prose prose-neutral max-w-none">
        {locale === "ro" ? (
          <>
            <h2>Arta românească, selectată de curatori</h2>
            <p>Cumpără lucrări autentice din pictură, desen, fotografie și artă digitală. Colaborăm direct cu artiști din România, iar echipa noastră de curatori te ajută să alegi în siguranță.</p>
            <p>Ai întrebări sau vrei o lucrare pe comandă? <strong>Întreabă un curator</strong> și primești răspuns rapid.</p>
          </>
        ) : (
          <>
            <h2>Romanian art, curated</h2>
            <p>Shop original paintings, drawings, photography and digital art. We work directly with Romanian artists; our curators help you buy with confidence.</p>
            <p>Questions or commissions? <strong>Ask a curator</strong> — fast, friendly guidance.</p>
          </>
        )}
      </section>


    </div>
  );
}
