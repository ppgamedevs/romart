/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },
  images: {
    domains: ['images.unsplash.com'],
  },
};

module.exports = nextConfig;
