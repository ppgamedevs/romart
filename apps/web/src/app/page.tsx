import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
	return (
		<main className="min-h-screen flex flex-col items-center justify-center p-8">
			<div className="max-w-4xl mx-auto text-center space-y-8">
				<div className="space-y-4">
					<h1 className="text-4xl font-bold text-foreground">
						Artfromromania MVP Running
					</h1>
					<p className="text-xl text-muted-foreground">
						Romanian Art Marketplace - SEO-first, production-ready monorepo
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Design System</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Explore our comprehensive design system with Tailwind CSS, shadcn/ui components, 
								and domain-specific patterns for the art marketplace.
							</p>
							<Link href="/styleguide">
								<Button className="w-full">View Styleguide</Button>
							</Link>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>API Health</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Check the health status of our Fastify API and Next.js application.
							</p>
							<a href="http://localhost:3001/healthz" target="_blank" rel="noopener noreferrer">
								<Button variant="outline" className="w-full">
									Check API Health
								</Button>
							</a>
						</CardContent>
					</Card>
				</div>

				<div className="text-sm text-muted-foreground">
					Next.js App Router • Fastify API • TypeScript • Tailwind CSS • shadcn/ui
				</div>
			</div>
		</main>
	);
}
