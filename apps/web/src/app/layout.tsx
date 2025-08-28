import type { Metadata } from "next";
import "./globals.css";
// import { fontSans } from "@/app/fonts";
// import { ClientProviders } from "@/components/providers/ClientProviders";
// import VitalsReporter from "@/components/metrics/VitalsReporter";

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
	// const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_HOST || "";
	// const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	return (
		<html lang="en">
			<head>
				{/* <link rel="icon" href="/favicon.ico" /> */}
				{/* {r2 && <link rel="preconnect" href={r2} crossOrigin="" />} */}
				{/* <link rel="preconnect" href={api} crossOrigin="" /> */}
				{/* <link rel="dns-prefetch" href="https://js.stripe.com" /> */}
				<meta name="theme-color" content="#ffffff" />
			</head>
			<body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning={true}>
				{/* <ClientProviders> */}
					{children}
				{/* </ClientProviders> */}
				{/* <VitalsReporter /> */}
			</body>
		</html>
	);
}
