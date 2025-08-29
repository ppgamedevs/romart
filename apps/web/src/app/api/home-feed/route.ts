export async function GET() {
  // Mock data for home feed
  const data = {
    collections: [
      {
        id: "1",
        name: "Contemporary Romanian Art",
        description: "Modern works from emerging artists",
        slug: "contemporary-romanian-art",
        imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop"
      },
      {
        id: "2", 
        name: "Traditional Paintings",
        description: "Classical Romanian painting styles",
        slug: "traditional-paintings",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
      }
    ],
    trending: [
      {
        id: "1",
        slug: "artwork-1",
        title: "Abstract Composition",
        artistName: "Maria Popescu",
        priceMinor: 150000,
        imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop"
      },
      {
        id: "2",
        slug: "artwork-2", 
        title: "Urban Landscape",
        artistName: "Ion Vasilescu",
        priceMinor: 200000,
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop"
      }
    ],
    newest: [
      {
        id: "3",
        slug: "artwork-3",
        title: "Portrait Study", 
        artistName: "Ana Dumitrescu",
        priceMinor: 120000,
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop"
      }
    ],
    underPrice: [
      {
        id: "4",
        slug: "artwork-4",
        title: "Small Study",
        artistName: "Vasile Popa", 
        priceMinor: 45000,
        imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop"
      }
    ]
  };

  return Response.json(data);
}
