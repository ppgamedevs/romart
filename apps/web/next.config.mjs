/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      "@/components/ui", 
      "lucide-react", 
      "date-fns"
    ],
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
      // HTML default: controlled at route handler level
    ];
  },
};

export default nextConfig;
