import type { MetadataRoute } from 'next'
import { getAllPublishedSlugs } from '@/lib/queries/articles'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://goldee.app'
  const slugs = await getAllPublishedSlugs()
  const now   = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url:             base,
      lastModified:    now,
      changeFrequency: 'always',
      priority:        1.0,
    },
    {
      url:             `${base}/history`,
      lastModified:    now,
      changeFrequency: 'hourly',
      priority:        0.8,
    },
    {
      url:             `${base}/calculator`,
      lastModified:    now,
      changeFrequency: 'daily',
      priority:        0.7,
    },
    {
      url:             `${base}/articles`,
      lastModified:    now,
      changeFrequency: 'daily',
      priority:        0.7,
    },
    {
      url:             `${base}/about`,
      lastModified:    now,
      changeFrequency: 'monthly',
      priority:        0.4,
    },
  ]

  const articleRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url:             `${base}/articles/${slug}`,
    changeFrequency: 'weekly' as const,
    priority:        0.6,
  }))

  return [...staticRoutes, ...articleRoutes]
}
