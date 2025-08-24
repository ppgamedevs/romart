import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, User } from "lucide-react"
import { CdnImage } from "@/components/ui/cdn-image"

interface ArtistCardProps {
	artist?: {
		id: string
		name: string
		location: string
		bio: string
		avatarUrl?: string
	}
	loading?: boolean
}

export function ArtistCard({ artist, loading = false }: ArtistCardProps) {
	if (loading) {
		return (
			<Card className="overflow-hidden">
				<CardHeader className="pb-4">
					<div className="flex items-center gap-4">
						<Skeleton className="h-16 w-16 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-24" />
						</div>
					</div>
				</CardHeader>
				<CardContent className="pb-4">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4 mt-2" />
				</CardContent>
				<CardFooter>
					<Skeleton className="h-9 w-full" />
				</CardFooter>
			</Card>
		)
	}

	if (!artist) return null

	return (
		<Card className="overflow-hidden hover:shadow-md transition-shadow">
			<CardHeader className="pb-4">
				<div className="flex items-center gap-4">
					<div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
						{artist.avatarUrl ? (
							<CdnImage
								src={artist.avatarUrl}
								alt={artist.name}
								width={64}
								height={64}
								className="h-full w-full rounded-full object-cover"
							/>
						) : (
							<User className="h-8 w-8 text-muted-foreground" />
						)}
					</div>
					<div>
						<h3 className="font-semibold text-lg">{artist.name}</h3>
						<div className="flex items-center gap-1 text-sm text-muted-foreground">
							<MapPin className="h-3 w-3" />
							{artist.location}
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pb-4">
				<p className="text-sm text-muted-foreground line-clamp-3">
					{artist.bio}
				</p>
			</CardContent>
			<CardFooter>
				<Button className="w-full" variant="outline">
					View Profile
				</Button>
			</CardFooter>
		</Card>
	)
}
