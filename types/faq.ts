export interface FaqItem {
  id:          string
  question:    string
  answer:      string
  sortOrder:   number
  isPublished: boolean
  createdAt:   Date
  updatedAt:   Date
}

// Lightweight version for rendering — omits meta fields
export type FaqItemDisplay = Pick<FaqItem, 'id' | 'question' | 'answer' | 'sortOrder'>
