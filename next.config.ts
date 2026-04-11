import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

// When a parent directory has another lockfile, Next may infer the wrong workspace
// root and break `next start` / API routes locally — pin tracing to this app.
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  images: {
    // ── Article cover images ──────────────────────────────────────────────────
    // Add the hostname of your image CDN or CMS here when articles have cover images.
    //
    // Examples:
    //   { protocol: 'https', hostname: 'images.example.com' }
    //   { protocol: 'https', hostname: '*.cloudinary.com' }
    //   { protocol: 'https', hostname: '*.supabase.co' }
    //
    // Until this is configured, keep coverImageUrl null in seeded articles to
    // avoid Next.js Image domain errors at runtime.
    remotePatterns: [],
  },

  // ── Security hardening ────────────────────────────────────────────────────
  // Additional security headers are in vercel.json (applied at the CDN edge).
  // These headers apply at the Next.js layer for non-Vercel environments.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },

  reactStrictMode: true,
}

export default nextConfig
