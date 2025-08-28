import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "../globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary";
import { notFound } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = 'force-dynamic'

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

export async function generateStaticParams() {
	return [{ locale: "en" }, { locale: "ro" }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	const { locale } = await params;
	
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://artfromromania.com";
	
	return {
		title: {
			default: locale === "ro" ? "Artfromromania - Piața de Artă Românească" : "Artfromromania - Romanian Art Marketplace",
			template: locale === "ro" ? "%s | Artfromromania" : "%s | Artfromromania"
		},
		description: locale === "ro" 
			? "Descoperă și colecționează artă românească originală, printuri și lucrări digitale de la artiști talentați."
			: "Discover and collect original Romanian art, prints, and digital artworks from talented artists.",
		keywords: locale === "ro" 
			? ["artă românească", "piața de artă", "artă originală", "printuri", "artă digitală", "artiști"]
			: ["Romanian art", "art marketplace", "original art", "prints", "digital art", "artists"],
		authors: [{ name: "Artfromromania Team" }],
		creator: "Artfromromania",
		publisher: "Artfromromania",
		formatDetection: {
			email: false,
			address: false,
			telephone: false
		},
		metadataBase: new URL(baseUrl),
		alternates: {
			canonical: `/${locale}`,
			languages: {
				"en-US": `${baseUrl}/en`,
				"ro-RO": `${baseUrl}/ro`
			}
		},
		openGraph: {
			type: "website",
			locale: locale === "ro" ? "ro_RO" : "en_US",
			url: `${baseUrl}/${locale}`,
			title: locale === "ro" ? "Artfromromania - Piața de Artă Românească" : "Artfromromania - Romanian Art Marketplace",
			description: locale === "ro" 
				? "Descoperă și colecționează artă românească originală, printuri și lucrări digitale de la artiști talentați."
				: "Discover and collect original Romanian art, prints, and digital artworks from talented artists.",
			siteName: "Artfromromania",
			images: [
				{
					url: "/og-image.jpg",
					width: 1200,
					height: 630,
					alt: locale === "ro" ? "Artfromromania - Piața de Artă Românească" : "Artfromromania - Romanian Art Marketplace"
				}
			]
		},
		twitter: {
			card: "summary_large_image",
			title: locale === "ro" ? "Artfromromania - Piața de Artă Românească" : "Artfromromania - Romanian Art Marketplace",
			description: locale === "ro" 
				? "Descoperă și colecționează artă românească originală, printuri și lucrări digitale de la artiști talentați."
				: "Discover and collect original Romanian art, prints, and digital artworks from talented artists.",
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
}

export default async function LocaleLayout({
	children,
	params
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	
	// Validate that the incoming `locale` parameter is valid
	if (!["en", "ro"].includes(locale)) {
		notFound();
	}
	
	return (
		<html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
			<head>
				<link rel="icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				<link rel="manifest" href="/manifest.json" />
				{process.env.CDN_PUBLIC_URL && (
					<link rel="preconnect" href={process.env.CDN_PUBLIC_URL} crossOrigin="anonymous" />
				)}
			</head>
			<body className="min-h-screen bg-background font-sans antialiased">
				<ErrorBoundary>
					<ClientProviders>
						{children}
						<Toaster />
					</ClientProviders>
				</ErrorBoundary>
			</body>
		</html>
	);
}
