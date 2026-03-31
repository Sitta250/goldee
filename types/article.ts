// ─── Article as stored in / returned from the database ───────────────────────

export interface Article {
  id: string
  slug: string
  titleTh: string
  titleEn: string | null
  summaryTh: string
  bodyTh: string
  coverImageUrl: string | null
  category: ArticleCategory
  isPublished: boolean
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// ─── Lightweight version for listing pages and cards ─────────────────────────

export type ArticleCardData = Pick<
  Article,
  'slug' | 'titleTh' | 'summaryTh' | 'coverImageUrl' | 'category' | 'publishedAt'
>

// ─── Category values ──────────────────────────────────────────────────────────

export type ArticleCategory = 'news' | 'guide' | 'explainer'

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  news:      'ข่าวสาร',
  guide:     'คู่มือ',
  explainer: 'ความรู้',
}
