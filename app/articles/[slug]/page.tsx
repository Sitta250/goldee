import type { Metadata } from 'next'
import { notFound }   from 'next/navigation'
import Image          from 'next/image'
import Link           from 'next/link'

import {
  getArticleBySlug,
  getRelatedArticles,
  getAllPublishedSlugs,
} from '@/lib/queries/articles'

import { buildMetadata }  from '@/lib/utils/metadata'
import { Container }      from '@/components/layout/Container'
import { ArticleBody }    from '@/components/articles/ArticleBody'
import { ArticleGrid }    from '@/components/articles/ArticleGrid'
import { CategoryBadge }  from '@/components/ui/Badge'
import { AdRectangle }    from '@/components/ads/AdRectangle'
import { Divider }        from '@/components/ui/Divider'
import { formatDate }     from '@/lib/utils/format'

// ─── ISR — pre-render all published slugs at build time ───────────────────────

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs()
  return slugs.map((slug) => ({ slug }))
}

// ─── Per-article metadata ─────────────────────────────────────────────────────

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug }  = await params
  const article   = await getArticleBySlug(slug)
  if (!article) return { title: 'บทความไม่พบ', robots: { index: false, follow: false } }

  return buildMetadata({
    title:         article.titleTh,
    description:   article.summaryTh,
    canonical:     `/articles/${slug}`,
    image:         article.coverImageUrl ?? '/og-image.png',
    type:          'article',
    publishedTime: article.publishedAt?.toISOString(),
  })
}

// Articles change rarely — revalidate every hour
export const revalidate = 3600

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params

  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const relatedArticles = await getRelatedArticles(slug, article.category)

  return (
    <div className="py-6 sm:py-8">
      <Container width="narrow">

        {/* ── Back link ─────────────────────────────────────────────────────── */}
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          กลับไปที่บทความทั้งหมด
        </Link>

        <article>
          {/* ── Cover image ───────────────────────────────────────────────── */}
          {article.coverImageUrl && (
            <div className="relative aspect-[2/1] rounded-card overflow-hidden mb-6 shadow-card">
              <Image
                src={article.coverImageUrl}
                alt={article.titleTh}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          )}

          {/* ── Header: category + date + title + excerpt ─────────────────── */}
          <header className="mb-6 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={article.category} />
              {article.publishedAt && (
                <time
                  dateTime={article.publishedAt.toISOString()}
                  className="text-sm text-gray-400"
                >
                  {formatDate(article.publishedAt)}
                </time>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
              {article.titleTh}
            </h1>

            <p className="text-base text-gray-600 leading-relaxed border-l-4 border-gold-300 pl-4 italic">
              {article.summaryTh}
            </p>
          </header>

          <Divider className="mb-8" />

          {/* ── Article body ──────────────────────────────────────────────── */}
          <ArticleBody markdown={article.bodyTh} />
        </article>

        {/* ── In-article ad slot ────────────────────────────────────────────── */}
        <div className="my-10">
          <AdRectangle />
        </div>

        {/* ── Related articles ──────────────────────────────────────────────── */}
        {relatedArticles.length > 0 && (
          <section aria-labelledby="related-heading" className="space-y-4">
            <Divider className="mb-6" />
            <h2 id="related-heading" className="text-lg font-semibold text-gray-900">
              บทความที่เกี่ยวข้อง
            </h2>
            <ArticleGrid articles={relatedArticles} columns={2} />
          </section>
        )}

        {/* ── Footer link back ──────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <Link
            href="/articles"
            className="text-sm text-gold-600 hover:underline font-medium"
          >
            ← ดูบทความทั้งหมด
          </Link>
        </div>

      </Container>
    </div>
  )
}
