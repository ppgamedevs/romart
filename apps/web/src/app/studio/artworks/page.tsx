import { Suspense } from "react"
import { getAuthSession } from "@/auth/utils"
import { redirect } from "next/navigation"
import { prisma } from "@artfromromania/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Palette, Image, Package } from "lucide-react"
import Link from "next/link"
import { formatPrice, formatDimensions } from "@artfromromania/shared"
import { ArtworkStatus, ArtworkKind } from "@artfromromania/db"

interface ArtworksPageProps {
  searchParams: Promise<{
    filter?: string
  }>
}

async function getArtworks(userId: string, filter?: string) {
  const artist = await prisma.artist.findUnique({
    where: { userId },
    select: { id: true }
  })

  if (!artist) {
    throw new Error("Artist profile not found")
  }

  const where: any = { artistId: artist.id }

  if (filter && filter !== "all") {
    where.status = filter.toUpperCase()
  }

  return await prisma.artwork.findMany({
    where,
    include: {
      images: {
        orderBy: { position: 'asc' },
        take: 1,
      },
      editions: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

function getStatusBadge(status: ArtworkStatus) {
  switch (status) {
    case "PUBLISHED":
      return <Badge className="bg-green-100 text-green-800">Published</Badge>
    case "DRAFT":
      return <Badge variant="secondary">Draft</Badge>
    case "ARCHIVED":
      return <Badge variant="outline">Archived</Badge>
    case "SOLD":
      return <Badge className="bg-blue-100 text-blue-800">Sold</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getKindIcon(kind: ArtworkKind) {
  switch (kind) {
    case "ORIGINAL":
      return <Palette className="h-4 w-4" />
    case "EDITIONED":
      return <Package className="h-4 w-4" />
    case "DIGITAL":
      return <Image className="h-4 w-4" />
    default:
      return <Palette className="h-4 w-4" />
  }
}

function getKindLabel(kind: ArtworkKind) {
  switch (kind) {
    case "ORIGINAL":
      return "Original"
    case "EDITIONED":
      return "Editioned"
    case "DIGITAL":
      return "Digital"
    default:
      return kind
  }
}

async function ArtworksList({ filter }: { filter?: string }) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const artworks = await getArtworks(session.user.id, filter)

  if (artworks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Palette className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No artworks yet</h3>
        <p className="text-muted-foreground mb-6">
          {filter === "published" 
            ? "You haven't published any artworks yet."
            : "Start by creating your first artwork."
          }
        </p>
        <Link href="/studio/artworks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Artwork
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {artworks.map((artwork: any) => (
        <Card key={artwork.id} className="group hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="relative aspect-square">
              {artwork.images[0] ? (
                <img
                  src={artwork.images[0].url}
                  alt={artwork.title}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-t-lg flex items-center justify-center">
                  <Image className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              <div className="absolute top-2 left-2 flex gap-1">
                {getStatusBadge(artwork.status)}
                <Badge variant="outline" className="flex items-center gap-1">
                  {getKindIcon(artwork.kind)}
                  {getKindLabel(artwork.kind)}
                </Badge>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium line-clamp-1">{artwork.title}</h3>
              </div>
              
              {artwork.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {artwork.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <span>
                  {artwork.images.length} image{artwork.images.length !== 1 ? 's' : ''}
                </span>
                {artwork.editions.length > 0 && (
                  <span>
                    {artwork.editions.length} edition{artwork.editions.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {artwork.priceAmount > 0 ? (
                    <span className="font-medium">
                      {formatPrice(artwork.priceAmount, artwork.priceCurrency)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No price set</span>
                  )}
                </div>
                
                <Link href={`/studio/artworks/${artwork.id}/edit`}>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function ArtworksPage({ searchParams }: ArtworksPageProps) {
  const params = await searchParams;
  const session = await getAuthSession()
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const filter = params.filter || "all"

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Artworks</h1>
          <p className="text-muted-foreground">
            Manage and publish your artworks
          </p>
        </div>
        
        <Link href="/studio/artworks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Artwork
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Link href="/studio/artworks">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm">
            All
          </Button>
        </Link>
        <Link href="/studio/artworks?filter=draft">
          <Button variant={filter === "draft" ? "default" : "outline"} size="sm">
            Drafts
          </Button>
        </Link>
        <Link href="/studio/artworks?filter=published">
          <Button variant={filter === "published" ? "default" : "outline"} size="sm">
            Published
          </Button>
        </Link>
        <Link href="/studio/artworks?filter=archived">
          <Button variant={filter === "archived" ? "default" : "outline"} size="sm">
            Archived
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Loading artworks...</div>}>
        <ArtworksList filter={filter} />
      </Suspense>
    </div>
  )
}
