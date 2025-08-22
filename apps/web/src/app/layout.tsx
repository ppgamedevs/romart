import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ 
	subsets: ["latin"],
	display: "swap",
	variable: "--font-sans"
});

const playfair = Playfair_Display({ 
	subsets: ["latin"],
	display: "swap",
	variable: "--font-serif"
});

export const metadata: Metadata = {
	title: {
		default: "Artfromromania - Romanian Art Marketplace",
		template: "%s | Artfromromania"
	},
	description: "Discover and collect original Romanian art, prints, and digital artworks from talented artists.",
	keywords: ["Romanian art", "art marketplace", "original art", "prints", "digital art", "artists"],
	authors: [{ name: "Artfromromania Team" }],
	creator: "Artfromromania",
	publisher: "Artfromromania",
	formatDetection: {
		email: false,
		address: false,
		telephone: false
	},
	metadataBase: new URL("https://artfromromania.com"),
	alternates: {
		canonical: "/",
		languages: {
			"en-US": "/en",
			"ro-RO": "/ro"
		}
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://artfromromania.com",
		title: "Artfromromania - Romanian Art Marketplace",
		description: "Discover and collect original Romanian art, prints, and digital artworks from talented artists.",
		siteName: "Artfromromania",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 630,
				alt: "Artfromromania - Romanian Art Marketplace"
			}
		]
	},
	twitter: {
		card: "summary_large_image",
		title: "Artfromromania - Romanian Art Marketplace",
		description: "Discover and collect original Romanian art, prints, and digital artworks from talented artists.",
		images: ["/og-image.jpg"],
		creator: "@artfromromania"
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1
		}
	},
	verification: {
		google: "your-google-verification-code",
		yandex: "your-yandex-verification-code"
	}
};

export default async function RootLayout({
	children,
	params
}: {
	children: React.ReactNode;
	params: Promise<{ lang?: string }>;
}) {
	const resolvedParams = await params;
	const lang = resolvedParams?.lang || "en";
	
	return (
		<html lang={lang} className={`${inter.variable} ${playfair.variable}`}>
			<head>
				<link rel="icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				<link rel="manifest" href="/manifest.json" />
				{/* Preconnect for CDN later */}
				{/* <link rel="preconnect" href="https://your-cdn.com" /> */}
			</head>
			<body className="min-h-screen bg-background font-sans antialiased">
				<TooltipProvider>
					{children}
				</TooltipProvider>
			</body>
		</html>
	);
}
