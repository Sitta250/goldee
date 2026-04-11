import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { ArticleCardData } from '@/types/article'
import { formatDate } from '@/lib/utils/format'
import { CategoryBadge } from '@/components/ui/Badge'

interface ArticleCardProps {
  article: ArticleCardData
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { slug, titleTh, summaryTh, coverImageUrl, category, publishedAt } = article

  return (
    <article className="group rounded-card bg-white border border-gray-100 overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
      <Link href={`/articles/${slug}`} tabIndex={-1} aria-hidden="true">
        {/* Cover image */}
        <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            // Placeholder when no cover image
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold-50 to-gold-100">
              <span className="text-gold-300 text-4xl select-none">✦</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 space-y-2">
        {/* Category + date */}
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={category} />
          {publishedAt && (
            <time
              dateTime={publishedAt.toISOString()}
              className="text-xs text-gray-400"
            >
              {formatDate(publishedAt)}
            </time>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-gold-600 transition-colors">
          <Link href={`/articles/${slug}`}>
            {titleTh}
          </Link>
        </h3>

        {/* Summary */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
          {summaryTh}
        </p>

        {/* Read more */}
        <Link
          href={`/articles/${slug}`}
          className="inline-block mt-1 text-xs font-medium text-gold-600 hover:underline"
        >
          อ่านต่อ <ArrowRight size={12} className="inline" aria-hidden />
        </Link>
      </div>
    </article>
  )
}
