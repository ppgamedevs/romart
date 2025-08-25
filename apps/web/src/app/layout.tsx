import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

const inter = Inter({ 
	subsets: ["latin"],
	display: "swap",
	variable: "--font-sans"
});

export const metadata: Metadata = {
	title: {
		default: "Artfromromania - Romanian Art Marketplace",
		template: "%s | Artfromromania"
	},
	description: "Discover and collect original Romanian art, prints, and digital artworks from talented artists.",
};

export default function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={inter.variable}>
			<head>
				<link rel="icon" href="/favicon.ico" />
			</head>
			<body className="min-h-screen bg-background font-sans antialiased">
				<ClientProviders>
					{children}
				</ClientProviders>
			</body>
		</html>
	);
}
