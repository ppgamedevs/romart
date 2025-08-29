import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@artfromromania/db";
import { InquiryButtons } from "@/components/inquiry/InquiryButtons";
import JsonLd from "@/components/seo/JsonLd";
import { altLanguages, canonicalUrl } from "@/lib/seo";
import { ArtistHeader } from "@/components/domain/artist/ArtistHeader";
import { ArtistTabs } from "@/components/domain/artist/ArtistTabs";
import { ArtistWorks } from "@/components/domain/artist/ArtistWorks";

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

  const path = `/artist/${slug}`;
  
  return {
    title: `${displayName} — Artist`,
    description: bio?.slice(0, 160) || `${displayName} - Romanian artist on Art from Romania`,
    alternates: { 
      canonical: canonicalUrl(path), 
      languages: altLanguages(path) 
    },
    openGraph: {
      title: displayName,
      description: bio || `${displayName} - Romanian artist on Art from Romania`,
      url: canonicalUrl(path),
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

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": displayName,
    "image": artist.avatarUrl || undefined,
    "url": canonicalUrl(`/artist/${artist.slug}`),
    "sameAs": artist.socials?.filter(Boolean)
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <JsonLd data={jsonld} />
        
        <ArtistHeader
          artist={{
            id: artist.id,
            displayName,
            avatarUrl: artist.avatarUrl,
            locationCity: artist.locationCity,
            locationCountry: artist.locationCountry,
            bio,
            followers: 0, // TODO: Add followers count
            sales: 0, // TODO: Add sales count
          }}
          locale={locale}
        />

        <ArtistTabs locale={locale} />

        <ArtistWorks
          artworks={artist.artworks.map((artwork: any) => ({
            id: artwork.id,
            slug: artwork.slug,
            title: artwork.title,
            artistName: displayName,
            image: artwork.heroImageUrl,
            minPriceMinor: artwork.minPriceMinor,
            priceMinor: artwork.priceAmount,
            salePct: artwork.salePct,
          }))}
          locale={locale}
        />
      </div>
    </div>
  );
}
