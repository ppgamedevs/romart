import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { altLanguages, canonicalUrl } from "@/lib/seo";
import { ArtworkGallery } from "@/components/pdp/ArtworkGallery";
import { BuyBox } from "@/components/pdp/BuyBox";

async function fetchArtwork(slug: string) {
  const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/artwork/by-slug/${slug}`, { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

async function fetchQuote(artworkId: string) {
  const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/price/quote?artworkId=${artworkId}`, { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const art = await fetchArtwork(params.slug);
  const title = art ? `${art.title} — ${art.artist?.displayName || "Artist"}` : "Artwork";
  const path = `/artwork/${params.slug}`;
  
  return {
    title,
    description: art?.seoDescription || art?.subtitle || "Artwork on Art from Romania",
    alternates: {
      canonical: canonicalUrl(path),
      languages: altLanguages(path)
    },
    other: {
      "google-site-verification": process.env.GOOGLE_SITE_VERIFICATION || ""
    },
    openGraph: {
      title,
      description: art?.subtitle || undefined,
      url: canonicalUrl(path),
      images: art?.images?.length ? [{ url: art.images[0].url, width: 1200, height: 630 }] : undefined,
      type: "website"
    },
    twitter: { 
      card: "summary_large_image", 
      site: process.env.TWITTER_HANDLE || undefined 
    }
  };
}

export default async function ArtworkPage({ params }: { params: { locale: string; slug: string } }) {
  const art = await fetchArtwork(params.slug);
  if (!art) return <div className="p-6">Not found</div>;
  
  const q = await fetchQuote(art.id);
  const priceMinor = q?.unit?.netMinor ?? art.saleMinor ?? art.priceMinor ?? null;
  const currency = q?.currency || art.currency || "EUR";

  // JSON-LD: VisualArtwork + Product (dacă e vânzabil)
  const images = (art.images || []).slice(0, 6).map((i: any) => i.url);
  const productOffer = priceMinor != null ? {
    "@type": "Offer",
    priceCurrency: currency,
    price: (priceMinor / 100).toFixed(2),
    availability: "https://schema.org/InStock",
    url: canonicalUrl(`/artwork/${art.slug}`)
  } : undefined;

  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "VisualArtwork",
      "name": art.title,
      "artform": art.medium, // Painting, Drawing, Photography, Digital
      "creator": art.artist?.displayName,
      "image": images,
      "url": canonicalUrl(`/artwork/${art.slug}`),
      "width": art.widthCm ? `${art.widthCm} cm` : undefined,
      "height": art.heightCm ? `${art.heightCm} cm` : undefined,
      "artEdition": (art.editions || []).length || undefined
    },
    productOffer && {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": art.title,
      "image": images,
      "brand": { "@type": "Person", "name": art.artist?.displayName || "Artist" },
      "offers": productOffer
    }
  ].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <JsonLd data={jsonld} />
        
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-8">
          {/* Left: Gallery */}
          <div>
            <ArtworkGallery
              images={art.images?.map((img: any) => img.url) || []}
              title={art.title}
            />
          </div>
          
          {/* Right: Buy Box */}
          <div>
            <BuyBox
              artwork={{
                id: art.id,
                title: art.title,
                artistName: art.artist?.displayName || "Artist",
                priceMinor: art.priceMinor,
                salePct: art.salePct,
                currency: art.currency,
              }}
              locale={params.locale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
