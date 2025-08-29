
import ArtworkGalleryPro from "@/components/pdp/ArtworkGalleryPro";
import BuyBoxV2 from "@/components/pdp/BuyBoxV2";

async function fetchArtwork(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const r = await fetch(`${baseUrl}/api/artwork/${slug}`, { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

async function fetchImages(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const r = await fetch(`${baseUrl}/api/artwork/${slug}/images`, { cache: "no-store" });
  return r.ok ? await r.json() : [];
}



async function fetchSizes() {
  // Poți muta în DB; pentru start definim 3 mărimi standard pentru print
  return [
    { key: "S", label: "Small", widthCm: 30, heightCm: 40 },
    { key: "M", label: "Medium", widthCm: 50, heightCm: 70 },
    { key: "L", label: "Large", widthCm: 70, heightCm: 100 },
  ];
}



export default async function ArtworkPage({ params }: { params: { locale: string; slug: string } }) {
  const art = await fetchArtwork(params.slug);
  if (!art) return <div className="p-6">Not found</div>;
  
  const images = await fetchImages(art.slug);
  
  const sizes = await fetchSizes();
  const soldOut = art.originalSold || !(art.editions || []).some((e: any) => e.active);
  const formats = ["ORIGINAL", "CANVAS", "METAL", "PHOTO"];

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-[1.1fr_0.9fr] gap-8">
      <div>
        <ArtworkGalleryPro images={(images || []).map((i: any) => ({ id: i.id, url: i.url, alt: art.title }))} />
      </div>
      <BuyBoxV2
        artworkId={art.id}
        slug={art.slug}
        artistName={art.artist?.displayName || "Artist"}
        title={art.title}
        baseCurrency={art.currency || "EUR"}
        formats={formats}
        sizes={sizes}
        destCountry="RO"
        soldOut={soldOut}
        defaultFormat={soldOut ? "CANVAS" : "ORIGINAL"}
      />
    </div>
  );
}
