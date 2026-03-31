import type { Metadata } from 'next'
import { Container } from '@/components/layout/Container'
import { ArticleGrid } from '@/components/articles/ArticleGrid'
import { AdRectangle } from '@/components/ads/AdRectangle'
import type { ArticleCategory } from '@/types/article'
import { ARTICLE_CATEGORY_LABELS } from '@/types/article'

// TODO: Uncomment when DB is ready
// import { getPaginatedArticles } from '@/lib/queries/articles'

export const metadata: Metadata = {
  title: 'บทความและความรู้',
  description:
    'รวมบทความเกี่ยวกับทองคำ ทั้งข่าวสาร คู่มือสำหรับมือใหม่ และความรู้ทั่วไปเกี่ยวกับการซื้อขายทองในประเทศไทย',
  alternates: { canonical: '/articles' },
}

interface ArticlesPageProps {
  searchParams: Promise<{ category?: string; page?: string }>
}

const CATEGORIES: Array<{ value: ArticleCategory | 'all'; label: string }> = [
  { value: 'all',       label: 'ทั้งหมด' },
  { value: 'news',      label: ARTICLE_CATEGORY_LABELS.news },
  { value: 'guide',     label: ARTICLE_CATEGORY_LABELS.guide },
  { value: 'explainer', label: ARTICLE_CATEGORY_LABELS.explainer },
]

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params   = await searchParams
  const category = params.category as ArticleCategory | undefined
  // const page     = parseInt(params.page ?? '1', 10)

  // TODO: Replace with real DB query
  // const { rows, total } = await getPaginatedArticles(page, 9, category)

  // ── Mock articles ──────────────────────────────────────────────────────────
  const mockArticles = [
    {
      slug: 'why-gold-price-rises',
      titleTh: 'ทำไมราคาทองถึงขึ้นในช่วงนี้?',
      summaryTh: 'เจาะลึกปัจจัยที่ทำให้ราคาทองคำพุ่งสูงขึ้น ตั้งแต่ดอลลาร์อ่อนค่าไปจนถึงความต้องการทองโลก',
      coverImageUrl: null,
      category: 'explainer' as ArticleCategory,
      publishedAt: new Date('2025-03-28'),
    },
    {
      slug: 'gold-bar-vs-jewelry',
      titleTh: 'ซื้อทองแท่งหรือทองรูปพรรณ อะไรดีกว่ากัน?',
      summaryTh: 'เปรียบเทียบข้อดีข้อเสียของทองแท่งและทองรูปพรรณ เพื่อช่วยให้คุณตัดสินใจได้ถูกต้อง',
      coverImageUrl: null,
      category: 'guide' as ArticleCategory,
      publishedAt: new Date('2025-03-25'),
    },
    {
      slug: 'gold-saving-beginners',
      titleTh: 'มือใหม่ออมทอง: เริ่มต้นอย่างไรให้ถูกวิธี',
      summaryTh: 'คู่มือฉบับย่อสำหรับผู้ที่ต้องการเริ่มออมทองเป็นครั้งแรก ข้อควรรู้และข้อผิดพลาดที่ควรหลีกเลี่ยง',
      coverImageUrl: null,
      category: 'guide' as ArticleCategory,
      publishedAt: new Date('2025-03-20'),
    },
    {
      slug: 'gold-market-update-q1',
      titleTh: 'อัพเดทตลาดทองไตรมาส 1 ปี 2568',
      summaryTh: 'สรุปสถานการณ์ตลาดทองคำในประเทศไทยและตลาดโลก ช่วงไตรมาสแรกของปี',
      coverImageUrl: null,
      category: 'news' as ArticleCategory,
      publishedAt: new Date('2025-03-15'),
    },
  ].filter((a) => !category || a.category === category)

  const activeCategory = category ?? 'all'

  return (
    <div className="py-6 sm:py-8 space-y-8">
      <Container>
        <h1 className="text-2xl font-bold text-gray-900">บทความและความรู้</h1>
        <p className="text-sm text-gray-500 mt-1">
          ข่าวสาร คู่มือ และความรู้เกี่ยวกับทองคำสำหรับคนไทย
        </p>
      </Container>

      <Container>
        {/* Category filter tabs */}
        <nav
          aria-label="กรองตามหมวดหมู่"
          className="flex gap-2 flex-wrap mb-6"
        >
          {CATEGORIES.map(({ value, label }) => {
            const isActive = activeCategory === value
            const href =
              value === 'all' ? '/articles' : `/articles?category=${value}`
            return (
              <a
                key={value}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gold-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </a>
            )
          })}
        </nav>

        <ArticleGrid articles={mockArticles} />

        {/* In-grid ad after 6 articles */}
        {mockArticles.length > 6 && (
          <div className="col-span-full">
            <AdRectangle />
          </div>
        )}

        {/* TODO: Pagination controls */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
          <span>หน้า 1 จาก 1</span>
        </div>
      </Container>
    </div>
  )
}
