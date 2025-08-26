import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@artfromromania/db";
import { InquiryButtons } from "@/components/inquiry/InquiryButtons";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  
  const artist = await getArtistBySlug({ locale, slug });
  if (!artist) {
    return {
      title: "Artist Not Found",
    };
  }

  const displayNameLocalized = artist.displayNameLocalized as Record<string, string> | null;
  const bioLocalized = artist.bioLocalized as Record<string, string> | null;
  
  const displayName = displayNameLocalized?.[locale] || 
                     displayNameLocalized?.en || 
                     artist.displayName;
  
  const bio = bioLocalized?.[locale] || 
              bioLocalized?.en || 
              artist.bio;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://artfromromania.com";
  const altLocale = locale === "ro" ? "en" : "ro";
  
  // Get the alternate slug for the other locale
  const altSlug = locale === "ro" ? artist.slugEn : artist.slugRo;
  const altUrl = altSlug ? `${baseUrl}/${altLocale}/artist/${altSlug}` : `${baseUrl}/${altLocale}`;

  return {
    title: `${displayName} | Artfromromania`,
    description: bio || `${displayName} - Romanian artist on Artfromromania`,
    alternates: {
      canonical: `${baseUrl}/${locale}/artist/${slug}`,
      languages: {
        "en-US": locale === "en" ? `${baseUrl}/en/artist/${slug}` : altUrl,
        "ro-RO": locale === "ro" ? `${baseUrl}/ro/artist/${slug}` : altUrl,
      }
    },
    openGraph: {
      title: displayName,
      description: bio || `${displayName} - Romanian artist on Artfromromania`,
      url: `${baseUrl}/${locale}/artist/${slug}`,
      type: "profile",
      images: artist.avatarUrl ? [artist.avatarUrl] : undefined,
    },
  };
}

async function getArtistBySlug({ locale, slug }: { locale: string; slug: string }) {
  // First try to find by the locale-specific slug
  const artist = await prisma.artist.findFirst({
    where: {
      OR: [
        { slugEn: slug },
        { slugRo: slug },
        { slug: slug } // fallback to original slug
      ],
      kycStatus: "APPROVED",
      banned: false,
      shadowbanned: false,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      },
      artworks: {
        where: {
          status: "PUBLISHED",
          visibility: "PUBLIC",
          suppressed: false,
          moderationStatus: "APPROVED",
        },
        orderBy: {
          publishedAt: "desc"
        },
        take: 10
      }
    }
  });

  if (!artist) {
    return null;
  }

  // If we found the artist but the slug doesn't match the current locale,
  // we should redirect to the correct slug for this locale
  const correctSlug = locale === "ro" ? artist.slugRo : artist.slugEn;
  if (correctSlug && correctSlug !== slug) {
    // This will trigger a redirect in the component
    return { ...artist, redirectTo: `/${locale}/artist/${correctSlug}` };
  }

  return artist;
}

export default async function ArtistPage({ params }: PageProps) {
  const { locale, slug } = await params;
  
  const artist = await getArtistBySlug({ locale, slug });
  
  if (!artist) {
    notFound();
  }

  // Handle redirect if needed
  if ('redirectTo' in artist) {
    // In a real implementation, you'd use Next.js redirect
    // For now, we'll just show the artist data
  }

  const displayNameLocalized = artist.displayNameLocalized as Record<string, string> | null;
  const bioLocalized = artist.bioLocalized as Record<string, string> | null;
  
  const displayName = displayNameLocalized?.[locale] || 
                     displayNameLocalized?.en || 
                     artist.displayName;
  
  const bio = bioLocalized?.[locale] || 
              bioLocalized?.en || 
              artist.bio;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Artist Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="flex-shrink-0">
            {artist.avatarUrl ? (
              <img
                src={artist.avatarUrl}
                alt={displayName}
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl text-gray-500">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{displayName}</h1>
            {artist.locationCity && (
              <p className="text-gray-600 mb-4">
                📍 {artist.locationCity}
                {artist.locationCountry && `, ${artist.locationCountry}`}
              </p>
            )}
            {bio && (
              <p className="text-gray-700 leading-relaxed mb-6">{bio}</p>
            )}
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                {locale === "ro" ? "Urmărește" : "Follow"}
              </button>
              
              <InquiryButtons
                artistId={artist.id}
                artistName={displayName}
                variant="outline"
                size="default"
              />
            </div>
          </div>
        </div>

        {/* Artworks Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">{locale === "ro" ? "Lucrări" : "Artworks"}</h2>
          {artist.artworks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artist.artworks.map((artwork: any) => (
                <div key={artwork.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {artwork.heroImageUrl && (
                    <img
                      src={artwork.heroImageUrl}
                      alt={artwork.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{artwork.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {artwork.year} • {artwork.medium}
                    </p>
                    <p className="text-lg font-bold">
                      €{(artwork.priceAmount / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              {locale === "ro" ? "Nu există lucrări publicate încă." : "No published artworks yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
