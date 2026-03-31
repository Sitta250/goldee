import type { Metadata } from 'next'

interface BuildMetadataOptions {
  title:          string
  description:    string
  canonical:      string
  image?:         string
  type?:          'website' | 'article'
  publishedTime?: string
}

/**
 * Shared helper for consistent Open Graph + Twitter Card metadata across all pages.
 * Pass the page-level title — the root layout template appends " | Goldee" automatically.
 */
export function buildMetadata({
  title,
  description,
  canonical,
  image = '/og-image.png',
  type  = 'website',
  publishedTime,
}: BuildMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url:   canonical,
      type,
      ...(publishedTime ? { publishedTime } : {}),
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [image],
    },
  }
}
