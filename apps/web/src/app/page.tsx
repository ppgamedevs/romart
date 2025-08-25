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
				<div className="text-sm text-muted-foreground">
					Next.js App Router • Fastify API • TypeScript • Tailwind CSS • shadcn/ui
				</div>
			</div>
		</main>
	);
}
