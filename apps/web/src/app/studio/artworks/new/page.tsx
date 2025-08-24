import { getAuthSession } from "@/auth/utils"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Palette, Package, Image, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createArtwork } from "../actions"

const artworkTypes = [
  {
    kind: "ORIGINAL" as const,
    title: "Original Artwork",
    description: "A unique, one-of-a-kind piece created by the artist",
    icon: Palette,
    features: [
      "Single unique piece",
      "Highest value potential",
      "Certificate of authenticity",
      "Direct artist connection"
    ],
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600"
  },
  {
    kind: "EDITIONED" as const,
    title: "Limited Edition",
    description: "Multiple prints or reproductions with a limited run",
    icon: Package,
    features: [
      "Limited quantity available",
      "Numbered editions",
      "Consistent quality",
      "More accessible pricing"
    ],
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600"
  },
  {
    kind: "DIGITAL" as const,
    title: "Digital Artwork",
    description: "Digital files that can be downloaded or printed",
    icon: Image,
    features: [
      "Instant delivery",
      "No shipping costs",
      "High-resolution files",
      "Print at home or professional"
    ],
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600"
  }
]

export default async function NewArtworkPage() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/studio/artworks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Artworks
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Artwork</h1>
          <p className="text-muted-foreground">
            Choose the type of artwork you want to create
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {artworkTypes.map((type) => {
          const Icon = type.icon
          return (
            <Card key={type.kind} className={`${type.color} hover:shadow-lg transition-shadow`}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-white ${type.iconColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{type.title}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {type.kind}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <form action={createArtwork.bind(null, type.kind)}>
                  <Button type="submit" className="w-full">
                    Create {type.title}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Not sure which type to choose?{" "}
          <Link href="/help/artwork-types" className="text-primary hover:underline">
            Learn more about artwork types
          </Link>
        </p>
      </div>
    </div>
  )
}
