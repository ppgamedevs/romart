import { getAuthSession } from "@/auth/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BecomeArtistButton } from "./become-artist-button"
import { OrderHistory } from "./order-history"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
	const session = await getAuthSession()

	if (!session?.user) {
		redirect("/sign-in")
	}

	const user = session.user

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="max-w-4xl mx-auto space-y-8">
				<div className="text-center space-y-4">
					<h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
					<Badge variant="secondary" className="text-sm">
						{user.role}
					</Badge>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Account Overview</CardTitle>
							<CardDescription>Your account information and status</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="text-sm font-medium text-muted-foreground">Email</label>
								<p className="text-sm">{user.email}</p>
							</div>
							<div>
								<label className="text-sm font-medium text-muted-foreground">Role</label>
								<p className="text-sm capitalize">{user.role.toLowerCase()}</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Quick Actions</CardTitle>
							<CardDescription>Common tasks and shortcuts</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{user.role === "BUYER" && <BecomeArtistButton />}
							{user.role === "ARTIST" && (
								<Button className="w-full" asChild>
									<Link href="/studio">Go to Artist Studio</Link>
								</Button>
							)}
							{user.role === "ADMIN" && (
								<Button className="w-full" variant="outline">
									Admin Panel (Coming Soon)
								</Button>
							)}
						</CardContent>
					</Card>
				</div>

				<OrderHistory userId={user.id} />

				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
						<CardDescription>Your latest actions and updates</CardDescription>
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
