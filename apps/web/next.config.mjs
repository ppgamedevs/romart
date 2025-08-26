import withSentryConfig from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable optimizePackageImports temporarily to fix webpack issues
    // optimizePackageImports: [
    //   "@/components/ui",
    //   "lucide-react",
    //   "date-fns",
    //   "@artfromromania/shared"
    // ],
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
    remotePatterns: (process.env.IMAGE_ALLOWED_ORIGINS || "")
      .split(",")
      .filter(Boolean)
      .map(host => ({
        protocol: "https",
        hostname: host.trim()
      })),
    formats: ["image/avif", "image/webp"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },
  async headers() {
    return [
      {
        source: "/:all*.(js|css|woff2|svg|png|jpg|jpeg|gif|webp|avif|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" }
        ]
      },
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
    ];
  },
};

export default withSentryConfig(nextConfig, { silent: true });
