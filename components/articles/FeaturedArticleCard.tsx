import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { ArticleCardData } from '@/types/article'
import { CategoryBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/format'

interface FeaturedArticleCardProps {
  article: ArticleCardData
}

/**
 * Full-width featured card for the latest article.
 * Desktop: horizontal layout (image left, text right).
 * Mobile: stacked (image on top).
 */
export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  const { slug, titleTh, summaryTh, coverImageUrl, category, publishedAt } = article

  return (
    <article className="group rounded-card bg-white border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow overflow-hidden">
      <Link href={`/articles/${slug}`} className="sm:flex" tabIndex={-1} aria-hidden="true">
        {/* Cover image — 16:9 on mobile, fixed height on desktop */}
        <div className="relative w-full aspect-[16/9] sm:aspect-auto sm:w-[45%] sm:shrink-0 bg-gray-100 overflow-hidden">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 45vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold-50 to-gold-100">
              <span className="text-gold-200 text-7xl select-none">✦</span>
            </div>
          )}
        </div>

        {/* Text content */}
        <div className="flex flex-col justify-center p-6 sm:p-8 flex-1 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={category} />
            {publishedAt && (
              <time dateTime={publishedAt.toISOString()} className="text-xs text-gray-400">
                {formatDate(publishedAt)}
              </time>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug group-hover:text-gold-600 transition-colors line-clamp-3">
            {titleTh}
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
            {summaryTh}
          </p>

          <span className="inline-block mt-1 text-sm font-semibold text-gold-600 group-hover:underline">
            อ่านบทความ <ArrowRight size={14} className="inline" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  )
}
