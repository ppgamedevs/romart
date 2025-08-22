import { notFound } from "next/navigation"
import { prisma } from "@artfromromania/db"
import { Metadata } from "next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, MapPin, Globe, Instagram, Facebook, Twitter } from "lucide-react"
import Link from "next/link"

interface ArtistPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const artist = await prisma.artist.findUnique({
    where: { slug: params.slug },
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
  const artist = await prisma.artist.findUnique({
    where: { slug: params.slug },
    include: {
      user: {
        select: {
          role: true
        }
      }
    }
  })

  if (!artist || artist.user.role !== "ARTIST") {
    notFound()
  }

  const education = Array.isArray(artist.education) ? artist.education : []
  const exhibitions = Array.isArray(artist.exhibitions) ? artist.exhibitions : []
  const awards = Array.isArray(artist.awards) ? artist.awards : []

  // Generate JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": artist.displayName,
    "url": `https://romart.com/artist/${artist.slug}`,
    "image": artist.avatarUrl,
    "sameAs": [
      artist.website,
      artist.instagram ? `https://instagram.com/${artist.instagram}` : null,
      artist.facebook ? `https://facebook.com/${artist.facebook}` : null,
      artist.x ? `https://x.com/${artist.x}` : null,
      artist.tiktok ? `https://tiktok.com/@${artist.tiktok}` : null,
      artist.youtube ? `https://youtube.com/@${artist.youtube}` : null,
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

              {/* Artworks Section (Placeholder for Prompt 7) */}
              <Card>
                <CardHeader>
                  <CardTitle>Artworks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="text-muted-foreground">
                      <p>Artworks will be displayed here</p>
                      <p className="text-sm">Coming soon in the next update</p>
                    </div>
                  </div>
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
                  
                  {(artist.website || artist.instagram || artist.facebook || artist.x || artist.tiktok || artist.youtube) && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Social Media</h4>
                      <div className="space-y-2">
                        {artist.website && (
                          <a
                            href={artist.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:underline"
                          >
                            <Globe className="h-4 w-4" />
                            <span>Website</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {artist.instagram && (
                          <a
                            href={`https://instagram.com/${artist.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-pink-600 hover:underline"
                          >
                            <Instagram className="h-4 w-4" />
                            <span>@{artist.instagram}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {artist.facebook && (
                          <a
                            href={`https://facebook.com/${artist.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:underline"
                          >
                            <Facebook className="h-4 w-4" />
                            <span>@{artist.facebook}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {artist.x && (
                          <a
                            href={`https://x.com/${artist.x}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-black hover:underline"
                          >
                            <Twitter className="h-4 w-4" />
                            <span>@{artist.x}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {artist.tiktok && (
                          <a
                            href={`https://tiktok.com/@${artist.tiktok}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-black hover:underline"
                          >
                            <span className="font-bold text-lg">TikTok</span>
                            <span>@{artist.tiktok}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {artist.youtube && (
                          <a
                            href={`https://youtube.com/@${artist.youtube}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-red-600 hover:underline"
                          >
                            <span className="font-bold text-lg">YouTube</span>
                            <span>@{artist.youtube}</span>
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
