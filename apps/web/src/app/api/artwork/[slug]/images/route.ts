import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Mock images data for testing
  const mockImages = [
    {
      id: "img_1",
      url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=1000&fit=crop",
      alt: "Sunset over Bucharest"
    },
    {
      id: "img_2", 
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1000&fit=crop",
      alt: "Artwork detail"
    },
    {
      id: "img_3",
      url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1000&fit=crop", 
      alt: "Close-up view"
    }
  ];

  return NextResponse.json(mockImages);
}
