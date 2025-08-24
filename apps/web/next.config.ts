import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		optimizePackageImports: ["@artfromromania/shared"]
	},
	// Suppress hydration warnings in development (often caused by browser extensions)
	reactStrictMode: true,
	outputFileTracingRoot: process.cwd(),
	webpack: (config, { isServer }) => {
		if (!isServer) {
			// Don't bundle node:crypto on the client side
			config.resolve.fallback = {
				...config.resolve.fallback,
				crypto: false,
				fs: false,
				path: false,
				os: false,
			}
		}
		return config
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**"
			}
		],
		formats: ["image/webp", "image/avif"]
	},
	// i18n: {
	// 	locales: ["en", "ro"],
	// 	defaultLocale: "en",
	// 	localeDetection: true
	// },
	compiler: {
		removeConsole: process.env.NODE_ENV === "production"
	},
	headers: async () => [
		{
			source: "/(.*)",
			headers: [
				{
					key: "X-Frame-Options",
					value: "DENY"
				},
				{
					key: "X-Content-Type-Options",
					value: "nosniff"
				},
				{
					key: "Referrer-Policy",
					value: "origin-when-cross-origin"
				}
			]
		}
	]
};

export default nextConfig;
