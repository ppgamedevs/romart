"use client"

import { useState } from "react"
import { PageShell } from "@/components/layout/page-shell"
import { Section } from "@/components/layout/section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArtistCard } from "@/components/domain/ArtistCard"
import { ArtworkCard } from "@/components/domain/ArtworkCard"
import { Moon, Sun, Palette, Type, Zap } from "lucide-react"

// Mock data for demonstration
const mockArtists = [
	{
		id: "1",
		name: "Maria Popescu",
		location: "Bucharest, Romania",
		bio: "Contemporary artist specializing in abstract expressionism and mixed media installations.",
		avatarUrl: undefined
	},
	{
		id: "2",
		name: "Alexandru Ionescu",
		location: "Cluj-Napoca, Romania",
		bio: "Digital artist and illustrator creating vibrant, surreal compositions inspired by Romanian folklore.",
		avatarUrl: undefined
	}
]

const mockArtworks = [
	{
		id: "1",
		title: "Abstract Harmony",
		artist: "Maria Popescu",
		price: 2500,
		type: "Original" as const,
		imageUrl: undefined
	},
	{
		id: "2",
		title: "Digital Dreams",
		artist: "Alexandru Ionescu",
		price: 150,
		type: "Digital" as const,
		imageUrl: undefined
	}
]

// Color tokens for display
const colorTokens = [
	{ name: "Primary", variable: "--primary", value: "240 5.9% 10%" },
	{ name: "Secondary", variable: "--secondary", value: "240 4.8% 95.9%" },
	{ name: "Accent", variable: "--accent", value: "240 4.8% 95.9%" },
	{ name: "Background", variable: "--background", value: "0 0% 100%" },
	{ name: "Foreground", variable: "--foreground", value: "240 10% 3.9%" },
	{ name: "Muted", variable: "--muted", value: "240 4.8% 95.9%" },
	{ name: "Card", variable: "--card", value: "0 0% 100%" },
	{ name: "Border", variable: "--border", value: "240 5.9% 90%" }
]

export default function StyleguidePage() {
	const [isDark, setIsDark] = useState(false)

	const toggleDarkMode = () => {
		setIsDark(!isDark)
		document.documentElement.classList.toggle("dark")
	}

	return (
		<PageShell
			title="Design System"
			description="RomArt design system showcasing typography, colors, components, and domain-specific UI patterns."
			actions={
				<Button onClick={toggleDarkMode} variant="outline" size="sm">
					{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
					{isDark ? "Light" : "Dark"} Mode
				</Button>
			}
		>
			<div className="space-y-12">
				{/* Typography */}
				<Section title="Typography" description="Font scale and text styles">
					<Card>
						<CardHeader>
							<CardTitle>Font Scale</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h1 className="text-4xl font-bold">Heading 1 (text-4xl)</h1>
								<h2 className="text-3xl font-bold">Heading 2 (text-3xl)</h2>
								<h3 className="text-2xl font-semibold">Heading 3 (text-2xl)</h3>
								<h4 className="text-xl font-semibold">Heading 4 (text-xl)</h4>
								<h5 className="text-lg font-medium">Heading 5 (text-lg)</h5>
								<h6 className="text-base font-medium">Heading 6 (text-base)</h6>
							</div>
							<div className="space-y-2">
								<p className="text-lg leading-relaxed">
									Lead paragraph with larger text and relaxed line height.
								</p>
								<p className="text-base">
									Regular paragraph text for body content.
								</p>
								<p className="text-sm text-muted-foreground">
									Small text for captions and secondary information.
								</p>
							</div>
						</CardContent>
					</Card>
				</Section>

				{/* Color Tokens */}
				<Section title="Color Tokens" description="Design system color palette">
					<Card>
						<CardHeader>
							<CardTitle>Color Swatches</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{colorTokens.map((color) => (
									<div key={color.name} className="space-y-2">
										<div
											className="h-16 rounded-lg border"
											style={{
												backgroundColor: `hsl(${color.value})`
											}}
										/>
										<div className="text-sm">
											<div className="font-medium">{color.name}</div>
											<div className="text-muted-foreground font-mono text-xs">
												{color.variable}
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</Section>

				{/* Components */}
				<Section title="Components" description="Core UI components">
					<div className="grid gap-6">
						{/* Buttons */}
						<Card>
							<CardHeader>
								<CardTitle>Buttons</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex flex-wrap gap-2">
									<Button>Default</Button>
									<Button variant="secondary">Secondary</Button>
									<Button variant="outline">Outline</Button>
									<Button variant="ghost">Ghost</Button>
									<Button variant="link">Link</Button>
									<Button variant="destructive">Destructive</Button>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button size="sm">Small</Button>
									<Button size="default">Default</Button>
									<Button size="lg">Large</Button>
								</div>
							</CardContent>
						</Card>

						{/* Badges */}
						<Card>
							<CardHeader>
								<CardTitle>Badges</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									<Badge>Default</Badge>
									<Badge variant="secondary">Secondary</Badge>
									<Badge variant="outline">Outline</Badge>
									<Badge variant="destructive">Destructive</Badge>
								</div>
							</CardContent>
						</Card>

						{/* Skeletons */}
						<Card>
							<CardHeader>
								<CardTitle>Loading States</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Skeleton className="h-4 w-[250px]" />
									<Skeleton className="h-4 w-[200px]" />
									<Skeleton className="h-4 w-[150px]" />
								</div>
								<div className="flex items-center space-x-4">
									<Skeleton className="h-12 w-12 rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-[250px]" />
										<Skeleton className="h-4 w-[200px]" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</Section>

				{/* Domain Components */}
				<Section title="Domain Components" description="Art marketplace specific components">
					<div className="grid gap-6">
						{/* Artist Cards */}
						<Card>
							<CardHeader>
								<CardTitle>Artist Cards</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{mockArtists.map((artist) => (
										<ArtistCard key={artist.id} artist={artist} />
									))}
									<ArtistCard loading />
								</div>
							</CardContent>
						</Card>

						{/* Artwork Cards */}
						<Card>
							<CardHeader>
								<CardTitle>Artwork Cards</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{mockArtworks.map((artwork) => (
										<ArtworkCard key={artwork.id} artwork={artwork} />
									))}
									<ArtworkCard loading />
								</div>
							</CardContent>
						</Card>
					</div>
				</Section>

				{/* Performance & Accessibility */}
				<Section title="Performance & Accessibility" description="Core Web Vitals targets and accessibility features">
					<Card>
						<CardContent className="pt-6">
							<div className="grid gap-4 md:grid-cols-3">
								<div className="flex items-center gap-2">
									<Zap className="h-4 w-4 text-primary" />
									<span className="text-sm font-medium">LCP &lt; 2.5s</span>
								</div>
								<div className="flex items-center gap-2">
									<Type className="h-4 w-4 text-primary" />
									<span className="text-sm font-medium">INP ≤ 200ms</span>
								</div>
								<div className="flex items-center gap-2">
									<Palette className="h-4 w-4 text-primary" />
									<span className="text-sm font-medium">CLS &lt; 0.1</span>
								</div>
							</div>
							<div className="mt-4 text-sm text-muted-foreground">
								All components include proper ARIA attributes, keyboard navigation, and focus management.
								Dark mode supports <code>prefers-color-scheme</code> and manual toggle.
							</div>
						</CardContent>
					</Card>
				</Section>
			</div>
		</PageShell>
	)
}
