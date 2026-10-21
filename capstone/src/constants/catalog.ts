import type { SortOption } from '../types/book.ts'

export const CATEGORIES = [
  { value: 'fiction', label: 'Fiction' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'romance', label: 'Romance' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'biography', label: 'Biography' },
  { value: 'poetry', label: 'Poetry' },
]

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'popular', label: 'Popularity' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'author', label: 'Author (A–Z)' },
]
