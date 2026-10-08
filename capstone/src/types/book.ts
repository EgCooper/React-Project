export interface BookSummary {
  id: string
  title: string
  authors: string[]
  coverId: number | null
  firstPublishYear: number | null
}
export type SortOption = 'relevance' | 'popular' | 'newest' | 'oldest' | 'author'

export interface BookDetail {
  id: string
  title: string
  authors: string[]
  description: string | null
  subjects: string[]
  coverId: number | null
}
