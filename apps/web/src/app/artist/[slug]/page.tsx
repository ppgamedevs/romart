import { notFound } from "next/navigation"
import { prisma } from "@artfromromania/db"
import { Metadata } from "next"

// ISR: Revalidate every 5 minutes
export const revalidate = 300;
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, MapPin, Globe, Instagram, Facebook, Twitter, Palette } from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@artfromromania/shared"
import { SocialMedia, isSocialMedia } from "@/types/socials"

interface ArtistPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artist = await prisma.artist.findUnique({
    where: { slug: slug },
    include: {
      user: {
        select: {
          role: true
        }
      }
    }
  })

  if (!artist || artist.user.role !== "ARTIST") {
    return {
      title: "Artist Not Found",
      description: "The requested artist profile could not be found."
    }
  }

  const location = [artist.locationCity, artist.locationCountry].filter(Boolean).join(", ")
  const description = artist.bio || `Discover the work of ${artist.displayName}, a talented artist${location ? ` from ${location}` : ""}.`

  return {
    title: `${artist.displayName} - Artist Profile | RomArt`,
    description,
    openGraph: {
      title: `${artist.displayName} - Artist Profile`,
      description,
      images: artist.avatarUrl ? [artist.avatarUrl] : [],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${artist.displayName} - Artist Profile`,
      description,
      images: artist.avatarUrl ? [artist.avatarUrl] : [],
    },
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { slug } = await params;
  const artist = await prisma.artist.findUnique({
    where: { slug: slug },
    include: {
      user: {
        select: {
          role: true
        }
      }
    }
  })

  if (!artist) {
    notFound()
  }

  // Fetch artworks separately to avoid TypeScript issues
  const artworks = await prisma.artwork.findMany({
    where: {
      artistId: artist.id,
      status: "PUBLISHED"
    },
    include: {
      images: {
        orderBy: { position: 'asc' },
        take: 1,
      },
      editions: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!artist) {
    notFound()
  }

  const education = Array.isArray(artist.education) ? artist.education : []
  const exhibitions = Array.isArray(artist.exhibitions) ? artist.exhibitions : []
  const awards = Array.isArray(artist.awards) ? artist.awards : []

  // Type the socials object properly
  const socials = isSocialMedia(artist.socials) ? artist.socials : null;

  // Generate JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": artist.displayName,
    "url": `https://romart.com/artist/${artist.slug}`,
    "image": artist.avatarUrl,
    "sameAs": [
      socials?.website,
      socials?.instagram ? `https://instagram.com/${socials.instagram}` : null,
      socials?.facebook ? `https://facebook.com/${socials.facebook}` : null,
      socials?.x ? `https://x.com/${socials.x}` : null,
      socials?.tiktok ? `https://tiktok.com/@${socials.tiktok}` : null,
      socials?.youtube ? `https://youtube.com/@${socials.youtube}` : null,
    ].filter(Boolean),
    "address": {
      "@type": "PostalAddress",
      "addressLocality": artist.locationCity,
      "addressCountry": artist.locationCountry,
    },
    "description": artist.bio,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative">
          {artist.coverUrl && (
            <div className="h-64 md:h-80 w-full overflow-hidden">
              <img
                src={artist.coverUrl}
                alt={`${artist.displayName} cover image`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20" />
          
          <div className="relative container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white shadow-lg">
                <AvatarImage src={artist.avatarUrl || ""} alt={artist.displayName} />
                <AvatarFallback className="text-2xl md:text-3xl">
                  {artist.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{artist.displayName}</h1>
                <div className="flex items-center space-x-4 text-white/90">
                  {artist.locationCity && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{artist.locationCity}</span>
                    </div>
                  )}
                  {artist.locationCountry && (
                    <span>{artist.locationCountry}</span>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button asChild variant="secondary">
                  <Link href={`/artist/${artist.slug}/contact`}>
                    Request Commission
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio & Statement */}
              {(artist.bio || artist.statement) && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {artist.bio && (
                      <div>
                        <h3 className="font-semibold mb-2">Bio</h3>
                        <p className="text-muted-foreground leading-relaxed">{artist.bio}</p>
                      </div>
                    )}
                    {artist.statement && (
                      <div>
                        <h3 className="font-semibold mb-2">Artist Statement</h3>
                        <p className="text-muted-foreground leading-relaxed">{artist.statement}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              {(education.length > 0 || exhibitions.length > 0 || awards.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Experience & Achievements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {education.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Education</h3>
                        <div className="space-y-3">
                          {education.map((edu: any, index: number) => (
                            <div key={index} className="p-4 bg-muted rounded-lg">
                              <div className="font-medium">{edu.school}</div>
                              {edu.program && <div className="text-sm text-muted-foreground">{edu.program}</div>}
                              {edu.year && <div className="text-sm text-muted-foreground">{edu.year}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {exhibitions.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Exhibitions</h3>
                        <div className="space-y-3">
                          {exhibitions.map((exhibition: any, index: number) => (
                            <div key={index} className="p-4 bg-muted rounded-lg">
                              <div className="font-medium">{exhibition.title}</div>
                              {exhibition.venue && <div className="text-sm text-muted-foreground">{exhibition.venue}</div>}
                              {exhibition.year && <div className="text-sm text-muted-foreground">{exhibition.year}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {awards.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Awards</h3>
                        <div className="space-y-3">
                          {awards.map((award: any, index: number) => (
                            <div key={index} className="p-4 bg-muted rounded-lg">
                              <div className="font-medium">{award.title}</div>
                              {award.org && <div className="text-sm text-muted-foreground">{award.org}</div>}
                              {award.year && <div className="text-sm text-muted-foreground">{award.year}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Artworks Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Artworks</CardTitle>
                </CardHeader>
                <CardContent>
                  {artworks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-muted-foreground">
                        <p>No published artworks yet</p>
                        <p className="text-sm">Check back soon for new works</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {artworks.map((artwork: any) => (
                        <Link key={artwork.id} href={`/artwork/${artwork.slug}`}>
                          <div className="group cursor-pointer">
                            <div className="aspect-square rounded-lg overflow-hidden border mb-3">
                              {artwork.images[0] ? (
                                <img
                                  src={artwork.images[0].url}
                                  alt={artwork.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <div className="text-muted-foreground">
                                    <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-xs">No image</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                {artwork.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {artwork.kind}
                                </Badge>
                                {artwork.priceAmount > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatPrice(artwork.priceAmount, artwork.priceCurrency)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact & Social */}
              <Card>
                <CardHeader>
                  <CardTitle>Connect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full">
                    <Link href={`/artist/${artist.slug}/contact`}>
                      Request Commission
                    </Link>
                  </Button>
                  
                  {socials && (socials.website || socials.instagram || socials.facebook || socials.x || socials.tiktok || socials.youtube) && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Social Media</h4>
                      <div className="space-y-2">
                        {socials?.website && (
                          <a
                            href={socials.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:underline"
                          >
                            <Globe className="h-4 w-4" />
                            <span>Website</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {socials?.instagram && (
                          <a
                            href={`https://instagram.com/${socials.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-pink-600 hover:underline"
                          >
                            <Instagram className="h-4 w-4" />
                            <span>@{socials.instagram}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {socials?.facebook && (
                          <a
                            href={`https://facebook.com/${socials.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:underline"
                          >
                            <Facebook className="h-4 w-4" />
                            <span>@{socials.facebook}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {socials?.x && (
                          <a
                            href={`https://x.com/${socials.x}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-black hover:underline"
                          >
                            <Twitter className="h-4 w-4" />
                            <span>@{socials.x}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {socials?.tiktok && (
                          <a
                            href={`https://tiktok.com/@${socials.tiktok}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-black hover:underline"
                          >
                            <span className="font-bold text-lg">TikTok</span>
                            <span>@{socials.tiktok}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {socials?.youtube && (
                          <a
                            href={`https://youtube.com/@${socials.youtube}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-red-600 hover:underline"
                          >
                            <span className="font-bold text-lg">YouTube</span>
                            <span>@{socials.youtube}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location */}
              {(artist.locationCity || artist.locationCountry) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {[artist.locationCity, artist.locationCountry].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
