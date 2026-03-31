import { db } from '@/lib/db'
import type { FaqItem, FaqItemDisplay } from '@/types/faq'

// ─── Queries ──────────────────────────────────────────────────────────────────

/** All published FAQ items, ordered by sortOrder — for homepage and /about */
export async function getPublishedFaqItems(): Promise<FaqItemDisplay[]> {
  const rows = await db.faqItem.findMany({
    where:   { isPublished: true },
    orderBy: { sortOrder: 'asc' },
    select:  { id: true, question: true, answer: true, sortOrder: true },
  })
  return rows
}

/** All FAQ items (including unpublished) — for admin use */
export async function getAllFaqItems(): Promise<FaqItem[]> {
  return db.faqItem.findMany({
    orderBy: { sortOrder: 'asc' },
  })
}

/** Count of published FAQ items */
export async function getFaqCount(): Promise<number> {
  return db.faqItem.count({ where: { isPublished: true } })
}
