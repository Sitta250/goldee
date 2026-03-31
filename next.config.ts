import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // TODO: Add your image CDN or CMS domain here when articles have cover images
      // Example: { protocol: 'https', hostname: 'your-cdn.com' }
    ],
  },
  // Strict mode for catching bugs early
  reactStrictMode: true,
}

export default nextConfig
