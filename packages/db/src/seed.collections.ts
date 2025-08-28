import { prisma } from "./index";

export async function seedCollections() {
  console.log("📚 Seeding collections...");

  // Create a curator profile for collections
  const curatorUser = await prisma.user.findFirst({
    where: { email: "curator@romart.com" }
  });

  let curatorProfile;
  if (curatorUser) {
    curatorProfile = await prisma.curatorProfile.findFirst({
      where: { userId: curatorUser.id }
    });
  }

  // Get some artworks to add to collections
  const artworks = await prisma.artwork.findMany({
    take: 10,
    select: { id: true }
  });

  if (artworks.length === 0) {
    console.log("No artworks found, skipping collections seed");
    return;
  }

  // Create featured collection
  const featuredCollection = await prisma.curatedCollection.upsert({
    where: { slug: "featured-2024" },
    update: {},
    create: {
      slug: "featured-2024",
      title: "Featured Works 2024",
      subtitle: "Our top picks from Romanian contemporary artists",
      description: "A carefully curated selection of the most compelling artworks from emerging and established Romanian artists.",
      coverImageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=630&fit=crop",
      heroTone: "DARK",
      curatorId: curatorProfile?.id,
      isFeatured: true,
      sortIndex: 0,
      publishedAt: new Date(),
      isPublic: true,
      items: {
        create: artworks.slice(0, 6).map((artwork, index) => ({
          artworkId: artwork.id,
          sortIndex: index,
          order: index
        }))
      }
    }
  });

  // Create abstract collection
  const abstractCollection = await prisma.curatedCollection.upsert({
    where: { slug: "abstract-expressions" },
    update: {},
    create: {
      slug: "abstract-expressions",
      title: "Abstract Expressions",
      subtitle: "Exploring form, color, and emotion",
      description: "A journey through abstract art that challenges perception and evokes deep emotional responses.",
      coverImageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=630&fit=crop",
      heroTone: "LIGHT",
      curatorId: curatorProfile?.id,
      isFeatured: false,
      sortIndex: 1,
      publishedAt: new Date(),
      isPublic: true,
      items: {
        create: artworks.slice(0, 4).map((artwork, index) => ({
          artworkId: artwork.id,
          sortIndex: index,
          order: index
        }))
      }
    }
  });

  console.log(`✅ Created collections: ${featuredCollection.title}, ${abstractCollection.title}`);
}
