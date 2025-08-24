import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Palette, User } from "lucide-react"
import { CdnImage } from "@/components/ui/cdn-image"

interface ArtworkCardProps {
	artwork?: {
		id: string
		title: string
		artist: string
		price: number
		type: "Original" | "Print" | "Digital"
		imageUrl?: string
	}
	loading?: boolean
}

export function ArtworkCard({ artwork, loading = false }: ArtworkCardProps) {
	if (loading) {
		return (
			<Card className="overflow-hidden">
				<CardHeader className="pb-4">
					<Skeleton className="aspect-[4/3] w-full" />
				</CardHeader>
				<CardContent className="pb-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-3 w-1/2" />
						<Skeleton className="h-4 w-1/3" />
					</div>
				</CardContent>
				<CardFooter>
					<Skeleton className="h-6 w-16" />
				</CardFooter>
			</Card>
		)
	}

	if (!artwork) return null

	return (
		<Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
			<CardHeader className="pb-4">
				<AspectRatio ratio={4 / 3} className="overflow-hidden rounded-lg">
					{artwork.imageUrl ? (
						<CdnImage
							src={artwork.imageUrl}
							alt={artwork.title}
							width={400}
							height={300}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="h-full w-full bg-muted flex items-center justify-center">
							<Palette className="h-12 w-12 text-muted-foreground" />
						</div>
					)}
				</AspectRatio>
			</CardHeader>
			<CardContent className="pb-4">
				<div className="space-y-2">
					<h3 className="font-semibold text-lg line-clamp-1">{artwork.title}</h3>
					<div className="flex items-center gap-1 text-sm text-muted-foreground">
						<User className="h-3 w-3" />
						{artwork.artist}
					</div>
					<div className="text-lg font-semibold text-primary">
						${artwork.price.toLocaleString()}
					</div>
				</div>
			</CardContent>
			<CardFooter>
				<Badge variant="secondary">{artwork.type}</Badge>
			</CardFooter>
		</Card>
	)
}
