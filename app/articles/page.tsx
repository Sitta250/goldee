import type { Metadata } from 'next'
import Link from 'next/link'

import { getPaginatedArticles } from '@/lib/queries/articles'
import type { ArticleCategory } from '@/types/article'
import { ARTICLE_CATEGORY_LABELS } from '@/types/article'

import { buildMetadata }        from '@/lib/utils/metadata'
import { Container }            from '@/components/layout/Container'
import { FeaturedArticleCard }  from '@/components/articles/FeaturedArticleCard'
import { ArticleGrid }          from '@/components/articles/ArticleGrid'
import { AdRectangle }          from '@/components/ads/AdRectangle'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMetadata({
  title:       'บทความและความรู้เกี่ยวกับทองคำ',
  description: 'รวมบทความทองคำ ข่าวสารราคาทอง คู่มือซื้อ-ขายทองสำหรับมือใหม่ และความรู้ทั่วไปเกี่ยวกับทองคำในประเทศไทย',
  canonical:   '/articles',
})

export const revalidate = 3600

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_CATEGORIES: ArticleCategory[] = ['news', 'guide', 'explainer']
const PER_PAGE = 9

const CATEGORIES: Array<{ value: ArticleCategory | 'all'; label: string }> = [
  { value: 'all',       label: 'ทั้งหมด' },
  { value: 'news',      label: ARTICLE_CATEGORY_LABELS.news },
  { value: 'guide',     label: ARTICLE_CATEGORY_LABELS.guide },
  { value: 'explainer', label: ARTICLE_CATEGORY_LABELS.explainer },
]

function parseCategory(raw: string | undefined): ArticleCategory | undefined {
  if (raw && (VALID_CATEGORIES as string[]).includes(raw)) {
    return raw as ArticleCategory
  }
  return undefined
}

function parsePage(raw: string | undefined): number {
  const n = parseInt(raw ?? '1', 10)
  return isNaN(n) || n < 1 ? 1 : n
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function NoArticles({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-card bg-gray-50 border border-gray-100 py-16 text-center space-y-2">
      <p className="text-3xl select-none">📄</p>
      <p className="text-base font-semibold text-gray-700">
        {filtered ? 'ยังไม่มีบทความในหมวดนี้' : 'ยังไม่มีบทความ'}
      </p>
      {filtered && (
        <Link href="/articles" className="text-sm text-gold-600 hover:underline">
          ดูบทความทั้งหมด →
        </Link>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const params   = await searchParams
  const category = parseCategory(params.category)
  const page     = parsePage(params.page)

  const { rows: articles, total } = await getPaginatedArticles(page, PER_PAGE, category)
  const totalPages    = Math.max(1, Math.ceil(total / PER_PAGE))
  const activeCategory = params.category ?? 'all'

  // On page 1: first article is featured, rest go into the grid
  const featured = page === 1 && articles.length > 0 ? articles[0] : null
  const gridArticles = page === 1 ? articles.slice(1) : articles

  return (
    <div className="py-6 sm:py-8">
      <Container>
        <div className="space-y-8">

          {/* ── 1. Page heading ───────────────────────────────────────────────── */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">บทความและความรู้</h1>
            <p className="text-sm text-gray-500 mt-1">
              ข่าวสาร คู่มือ และความรู้เกี่ยวกับทองคำสำหรับคนไทย
            </p>
          </div>

          {/* ── Category filter ───────────────────────────────────────────────── */}
          <nav aria-label="กรองตามหมวดหมู่" className="flex gap-2 flex-wrap">
            {CATEGORIES.map(({ value, label }) => {
              const isActive = activeCategory === value
              const href = value === 'all' ? '/articles' : `/articles?category=${value}`
              return (
                <Link
                  key={value}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gold-500 text-white pointer-events-none'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* ── 2. Featured latest article ─────────────────────────────────────── */}
          {articles.length === 0 ? (
            <NoArticles filtered={!!category} />
          ) : (
            <>
              {featured && <FeaturedArticleCard article={featured} />}

              {/* ── 3. Remaining article cards ──────────────────────────────── */}
              {gridArticles.length > 0 && (
                <ArticleGrid articles={gridArticles} />
              )}
            </>
          )}

          {/* ── 4. Ad slot ────────────────────────────────────────────────────── */}
          {articles.length > 0 && <AdRectangle />}

          {/* ── Pagination ────────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <ArticlesPagination
              page={page}
              totalPages={totalPages}
              category={params.category}
            />
          )}

        </div>
      </Container>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function ArticlesPagination({
  page,
  totalPages,
  category,
}: {
  page:       number
  totalPages: number
  category:   string | undefined
}) {
  function href(p: number) {
    const base = category ? `/articles?category=${category}` : '/articles'
    return p === 1 ? base : `${base}${category ? '&' : '?'}page=${p}`
  }

  return (
    <nav aria-label="การแบ่งหน้า" className="flex items-center justify-center gap-2 flex-wrap">
      {page > 1 ? (
        <Link href={href(page - 1)} className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          ← ก่อนหน้า
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-md text-sm text-gray-300 bg-gray-50">← ก่อนหน้า</span>
      )}

      <span className="text-sm text-gray-500">
        หน้า {page} จาก {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={href(page + 1)} className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          ถัดไป →
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-md text-sm text-gray-300 bg-gray-50">ถัดไป →</span>
      )}
    </nav>
  )
}
