import { db } from '@/lib/db'
import type { Article, ArticleCardData, ArticleCategory } from '@/types/article'

// ─── Select sets ──────────────────────────────────────────────────────────────

const cardSelect = {
  slug:         true,
  titleTh:      true,
  summaryTh:    true,
  coverImageUrl:true,
  category:     true,
  publishedAt:  true,
} as const

function toCardData(row: {
  slug:          string
  titleTh:       string
  summaryTh:     string
  coverImageUrl: string | null
  category:      string
  publishedAt:   Date | null
}): ArticleCardData {
  return {
    slug:          row.slug,
    titleTh:       row.titleTh,
    summaryTh:     row.summaryTh,
    coverImageUrl: row.coverImageUrl,
    category:      row.category as ArticleCategory,
    publishedAt:   row.publishedAt,
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Latest N published articles — used on the homepage */
export async function getLatestArticles(limit = 3): Promise<ArticleCardData[]> {
  const rows = await db.article.findMany({
    where:   { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take:    limit,
    select:  cardSelect,
  })
  return rows.map(toCardData)
}

/** Paginated published articles with optional category filter */
export async function getPaginatedArticles(
  page:      number,
  perPage  = 9,
  category?: ArticleCategory,
): Promise<{ rows: ArticleCardData[]; total: number }> {
  const where = {
    isPublished: true,
    ...(category ? { category } : {}),
  }

  const [rows, total] = await db.$transaction([
    db.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip:    (page - 1) * perPage,
      take:    perPage,
      select:  cardSelect,
    }),
    db.article.count({ where }),
  ])

  return { rows: rows.map(toCardData), total }
}

/** Full article by slug — used on the single article page */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const row = await db.article.findUnique({ where: { slug } })
  if (!row || !row.isPublished) return null

  return {
    id:            row.id,
    slug:          row.slug,
    titleTh:       row.titleTh,
    titleEn:       row.titleEn,
    summaryTh:     row.summaryTh,
    bodyTh:        row.bodyTh,
    coverImageUrl: row.coverImageUrl,
    category:      row.category as ArticleCategory,
    isPublished:   row.isPublished,
    publishedAt:   row.publishedAt,
    createdAt:     row.createdAt,
    updatedAt:     row.updatedAt,
  }
}

/** 3 related articles in the same category, excluding current slug */
export async function getRelatedArticles(
  slug:     string,
  category: ArticleCategory,
): Promise<ArticleCardData[]> {
  const rows = await db.article.findMany({
    where: {
      isPublished: true,
      category,
      NOT: { slug },
    },
    orderBy: { publishedAt: 'desc' },
    take:    3,
    select:  cardSelect,
  })
  return rows.map(toCardData)
}

/** Slugs of all published articles — used in generateStaticParams */
export async function getAllPublishedSlugs(): Promise<string[]> {
  const rows = await db.article.findMany({
    where:  { isPublished: true },
    select: { slug: true },
  })
  return rows.map((r) => r.slug)
}
