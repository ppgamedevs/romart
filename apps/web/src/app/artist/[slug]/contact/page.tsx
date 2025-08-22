import { notFound } from "next/navigation"
import { prisma } from "@artfromromania/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ContactPageProps {
  params: {
    slug: string
  }
}

export default async function ContactPage({ params }: ContactPageProps) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href={`/artist/${artist.slug}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Request Commission</CardTitle>
              <CardDescription>
                Contact {artist.displayName} for a custom artwork commission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <p className="text-lg mb-4">Commission request form coming soon!</p>
                  <p className="text-sm">
                    This feature will allow you to request custom artwork from {artist.displayName}.
                  </p>
                  <p className="text-sm mt-2">
                    For now, you can reach out through their social media or website.
                  </p>
                </div>
                
                <div className="mt-8 space-y-4">
                  {artist.website && (
                    <Button asChild variant="outline" className="w-full">
                      <a href={artist.website} target="_blank" rel="noopener noreferrer">
                        Visit Website
                      </a>
                    </Button>
                  )}
                  
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/artist/${artist.slug}`}>
                      Back to Artist Profile
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
