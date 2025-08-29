import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Mock artwork data for testing
  const mockArtwork = {
    id: "art_123",
    slug: params.slug,
    title: "Sunset over Bucharest",
    description: "A beautiful oil painting capturing the golden hour in Romania's capital",
    artist: {
      id: "artist_1",
      displayName: "Maria Popescu",
      slug: "maria-popescu"
    },
    priceMinor: 250000, // 2500 EUR
    currency: "EUR",
    status: "PUBLISHED",
    originalSold: false,
    editions: [
      {
        id: "ed_1",
        kind: "CANVAS",
        priceMinor: 75000, // 750 EUR
        active: true
      },
      {
        id: "ed_2", 
        kind: "METAL",
        priceMinor: 100000, // 1000 EUR
        active: true
      }
    ],
    images: [
      {
        id: "img_1",
        url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=1000&fit=crop",
        alt: "Sunset over Bucharest"
      },
      {
        id: "img_2",
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1000&fit=crop",
        alt: "Artwork detail"
      }
    ]
  };

  return NextResponse.json(mockArtwork);
}
