import { Suspense } from "react"
import { getAuthSession } from "@/auth/utils"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@artfromromania/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Eye } from "lucide-react"
import Link from "next/link"
import { ArtworkStatus, ArtworkKind } from "@prisma/client"
import { canPublish } from "@artfromromania/shared"
import { DetailsTab } from "./components/DetailsTab"
import { ImagesTab } from "./components/ImagesTab"
import { EditionsTab } from "./components/EditionsTab"
import { PublishTab } from "./components/PublishTab"

interface EditArtworkPageProps {
  params: Promise<{
    id: string
  }>
}

async function getArtwork(artworkId: string, userId: string) {
  const artist = await prisma.artist.findUnique({
    where: { userId },
    select: {
      id: true,
      displayName: true,
      kycStatus: true,
      completionScore: true,
    }
  })

  if (!artist) {
    throw new Error("Artist profile not found")
  }

  const artwork = await prisma.artwork.findFirst({
    where: {
      id: artworkId,
      artistId: artist.id,
    },
    include: {
      images: {
        orderBy: { position: 'asc' },
      },
      editions: true,
    }
  })

  if (!artwork) {
    return null
  }

  return { artwork, artist }
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

export default async function EditArtworkPage({ params }: EditArtworkPageProps) {
  const { id } = await params;
  const session = await getAuthSession()
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const data = await getArtwork(id, session.user.id)
  if (!data) {
    notFound()
  }

  const { artwork, artist } = data

  // Calculate publish validation
  const validation = canPublish({
    artist: {
      kycStatus: artist.kycStatus,
      completionScore: artist.completionScore,
    },
    artwork: {
      title: artwork.title,
      priceAmount: artwork.priceAmount,
      kind: artwork.kind,
      status: artwork.status,
    },
    imagesCount: artwork.images.length,
    hasPrimaryImage: artwork.images.some(img => img.position === 0),
    editions: artwork.editions.map(ed => ({
      unitAmount: ed.unitAmount,
      runSize: ed.runSize || undefined,
      available: ed.available || undefined,
    }))
  })

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/studio/artworks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Artworks
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">
                {artwork.title || "Untitled Artwork"}
              </h1>
              {getStatusBadge(artwork.status)}
              <Badge variant="outline">{getKindLabel(artwork.kind)}</Badge>
            </div>
            <p className="text-muted-foreground">
              Edit your artwork details and publish when ready
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {artwork.status === "PUBLISHED" && (
            <Link href={`/artwork/${artwork.slug}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Public
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="editions">Editions</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Suspense fallback={<div>Loading details...</div>}>
            <DetailsTab artwork={artwork} />
          </Suspense>
        </TabsContent>

        <TabsContent value="images" className="space-y-6">
          <Suspense fallback={<div>Loading images...</div>}>
            <ImagesTab artwork={artwork} />
          </Suspense>
        </TabsContent>

        <TabsContent value="editions" className="space-y-6">
          <Suspense fallback={<div>Loading editions...</div>}>
            <EditionsTab artwork={artwork} />
          </Suspense>
        </TabsContent>

        <TabsContent value="publish" className="space-y-6">
          <Suspense fallback={<div>Loading publish options...</div>}>
            <PublishTab 
              artwork={artwork} 
              artist={artist}
              validation={validation}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
