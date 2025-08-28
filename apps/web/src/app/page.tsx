import { Suspense } from "react";
import TrendingGrid, { TrendingGridSkeleton } from "@/components/recs/TrendingGrid";

export const dynamic = 'force-dynamic'

export default function HomePage() {
	return (
		<main className="min-h-screen p-8">
			<div className="max-w-6xl mx-auto space-y-8">
				<div className="text-center space-y-4">
					<h1 className="text-4xl font-bold text-foreground">
						Artfromromania MVP Running
					</h1>
					<p className="text-xl text-muted-foreground">
						Romanian Art Marketplace - SEO-first, production-ready monorepo
					</p>
					<div className="text-sm text-muted-foreground">
						Next.js App Router • Fastify API • TypeScript • Tailwind CSS • shadcn/ui
					</div>
				</div>

				{/* Trending Recommendations */}
				<Suspense fallback={<TrendingGridSkeleton />}>
					<TrendingGrid currency="EUR" title="Trending Artworks" />
				</Suspense>
			</div>
		</main>
	);
}
