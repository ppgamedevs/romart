export async function GET() {
  // Return mock data for development
  const mockData = {
    collections: [
      {
        id: "1",
        name: "Contemporary Romanian Art",
        description: "A curated collection of modern Romanian artists",
        imageUrl: "https://via.placeholder.com/400x300",
        artworkCount: 12
      },
      {
        id: "2", 
        name: "Traditional Paintings",
        description: "Classical Romanian painting techniques",
        imageUrl: "https://via.placeholder.com/400x300",
        artworkCount: 8
      }
    ],
    trending: [
      {
        id: "1",
        title: "Abstract Composition",
        artistName: "Maria Popescu",
        priceMinor: 150000,
        imageUrl: "https://via.placeholder.com/300x400"
      },
      {
        id: "2",
        title: "Urban Landscape", 
        artistName: "Ion Vasilescu",
        priceMinor: 200000,
        imageUrl: "https://via.placeholder.com/300x400"
      }
    ],
    newest: [
      {
        id: "3",
        title: "Portrait Study",
        artistName: "Ana Dumitrescu", 
        priceMinor: 120000,
        imageUrl: "https://via.placeholder.com/300x400"
      },
      {
        id: "4",
        title: "Modern Still Life",
        artistName: "George Ionescu",
        priceMinor: 180000,
        imageUrl: "https://via.placeholder.com/300x400"
      }
    ],
    underPrice: [
      {
        id: "5",
        title: "Small Study",
        artistName: "Vasile Popa",
        priceMinor: 45000,
        imageUrl: "https://via.placeholder.com/300x400"
      },
      {
        id: "6", 
        title: "Sketch",
        artistName: "Diana Munteanu",
        priceMinor: 35000,
        imageUrl: "https://via.placeholder.com/300x400"
      }
    ]
  };

  return Response.json(mockData);
}
