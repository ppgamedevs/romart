import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"

export default async function StudioPage() {
	const user = await getCurrentUser()

	if (!user) {
		redirect("/sign-in")
	}

	if (user.role !== "ARTIST" && user.role !== "ADMIN") {
		redirect("/dashboard?upgrade=artist")
	}

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="max-w-6xl mx-auto space-y-8">
				<div className="text-center space-y-4">
					<h1 className="text-3xl font-bold">Artist Studio</h1>
					<p className="text-muted-foreground">
						Manage your artworks, exhibitions, and artist profile
					</p>
					<Badge variant="secondary" className="text-sm">
						{user.role}
					</Badge>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Artworks</CardTitle>
							<CardDescription>Manage your art pieces</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Upload and manage your artworks, set prices, and track sales.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Profile</CardTitle>
							<CardDescription>Your artist profile</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Update your bio, statement, and artist information.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Analytics</CardTitle>
							<CardDescription>Sales and performance</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								View your sales data, visitor statistics, and earnings.
							</p>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
						<CardDescription>Your latest studio activities</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							No recent activity to display.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
