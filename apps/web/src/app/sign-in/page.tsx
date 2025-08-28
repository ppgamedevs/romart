import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default function SignInPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl text-center">Sign In</CardTitle>
					<CardDescription className="text-center">
						Authentication will be implemented here
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground">
						This is a placeholder sign-in page.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
