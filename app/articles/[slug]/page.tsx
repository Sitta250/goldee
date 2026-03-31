import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { ArticleBody } from '@/components/articles/ArticleBody'
import { ArticleGrid } from '@/components/articles/ArticleGrid'
import { CategoryBadge } from '@/components/ui/Badge'
import { AdRectangle } from '@/components/ads/AdRectangle'
import { Divider } from '@/components/ui/Divider'
import { formatDate } from '@/lib/utils/format'

// TODO: Uncomment when DB is ready
// import { getArticleBySlug, getRelatedArticles } from '@/lib/queries/articles'

// ─── Static params for ISR ────────────────────────────────────────────────────
// TODO: Enable generateStaticParams when articles are in DB
// export async function generateStaticParams() {
//   const articles = await db.article.findMany({
//     where: { published: true },
//     select: { slug: true },
//   })
//   return articles.map((a) => ({ slug: a.slug }))
// }

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params

  // TODO: Replace with real DB query
  // const article = await getArticleBySlug(slug)
  // if (!article) return {}

  // Mock metadata
  const titles: Record<string, string> = {
    'why-gold-price-rises':  'ทำไมราคาทองถึงขึ้นในช่วงนี้?',
    'gold-bar-vs-jewelry':   'ซื้อทองแท่งหรือทองรูปพรรณ อะไรดีกว่ากัน?',
    'gold-saving-beginners': 'มือใหม่ออมทอง: เริ่มต้นอย่างไรให้ถูกวิธี',
  }

  return {
    title:       titles[slug] ?? 'บทความ',
    alternates:  { canonical: `/articles/${slug}` },
  }
}

export const revalidate = 3600 // Articles change less often — 1 hour

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params

  // TODO: Replace with real DB queries
  // const article = await getArticleBySlug(slug)
  // if (!article) notFound()
  // const related = await getRelatedArticles(slug, article.category)

  // ── Mock article ────────────────────────────────────────────────────────────
  const MOCK_ARTICLES: Record<string, {
    slug: string; titleTh: string; summaryTh: string; bodyTh: string;
    coverImageUrl: null; category: 'news' | 'guide' | 'explainer'; publishedAt: Date
  }> = {
    'why-gold-price-rises': {
      slug:         'why-gold-price-rises',
      titleTh:      'ทำไมราคาทองถึงขึ้นในช่วงนี้?',
      summaryTh:    'เจาะลึกปัจจัยที่ทำให้ราคาทองคำพุ่งสูงขึ้น ตั้งแต่ดอลลาร์อ่อนค่าไปจนถึงความต้องการทองโลก',
      bodyTh:       `## ปัจจัยหลักที่ทำให้ราคาทองขึ้น

ราคาทองคำในตลาดโลกมีความสัมพันธ์กับหลายปัจจัยพร้อมกัน ได้แก่:

### 1. ค่าเงินดอลลาร์สหรัฐ
เมื่อดอลลาร์อ่อนค่า นักลงทุนมักหันมาถือครองทองคำมากขึ้น เนื่องจากทองคำถูกกำหนดราคาเป็นดอลลาร์ในตลาดโลก

### 2. ความไม่แน่นอนทางเศรษฐกิจ
ในช่วงที่เศรษฐกิจโลกมีความผันผวน นักลงทุนมักมองทองคำเป็น "สินทรัพย์ปลอดภัย" (Safe Haven)

### 3. ความต้องการจากธนาคารกลาง
ธนาคารกลางหลายประเทศเพิ่มการถือครองทองคำในทุนสำรองระหว่างประเทศ

## สรุป

ราคาทองคำในประเทศไทยยังเคลื่อนไหวตามตลาดโลกเป็นหลัก ประกอบกับอัตราแลกเปลี่ยนบาท/ดอลลาร์
`,
      coverImageUrl:null,
      category:     'explainer',
      publishedAt:  new Date('2025-03-28'),
    },
  }

  const article = MOCK_ARTICLES[slug]
  if (!article) notFound()

  const relatedArticles = [
    {
      slug: 'gold-bar-vs-jewelry',
      titleTh: 'ซื้อทองแท่งหรือทองรูปพรรณ อะไรดีกว่ากัน?',
      summaryTh: 'เปรียบเทียบข้อดีข้อเสียของทองแท่งและทองรูปพรรณ',
      coverImageUrl: null,
      category: 'guide' as const,
      publishedAt: new Date('2025-03-25'),
    },
  ]

  return (
    <div className="py-6 sm:py-8">
      <Container width="narrow">
        {/* Back link */}
        <Link
          href="/articles"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          ← กลับไปที่บทความทั้งหมด
        </Link>

        <article>
          {/* Cover image */}
          {article.coverImageUrl && (
            <div className="relative aspect-[2/1] rounded-card overflow-hidden mb-6">
              <Image
                src={article.coverImageUrl}
                alt={article.titleTh}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Meta */}
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

            <p className="text-base text-gray-600 leading-relaxed">
              {article.summaryTh}
            </p>
          </header>

          <Divider className="mb-6" />

          {/* Article body */}
          <ArticleBody markdown={article.bodyTh} />
        </article>

        {/* In-article ad */}
        <AdRectangle />

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">บทความที่เกี่ยวข้อง</h2>
            <ArticleGrid articles={relatedArticles} columns={2} />
          </section>
        )}
      </Container>
    </div>
  )
}
