import type { ArticleCardData } from '@/types/article'
import { ArticleCard } from './ArticleCard'

interface ArticleGridProps {
  articles: ArticleCardData[]
  // Compact = 3 cols; default allows 2 cols on tablet
  columns?: 2 | 3
}

export function ArticleGrid({ articles, columns = 3 }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        ยังไม่มีบทความในขณะนี้
      </p>
    )
  }

  const gridClass =
    columns === 3
      ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid gap-5 sm:grid-cols-2'

  return (
    <ul className={gridClass} role="list">
      {articles.map((article) => (
        <li key={article.slug}>
          <ArticleCard article={article} />
        </li>
      ))}
    </ul>
  )
}
