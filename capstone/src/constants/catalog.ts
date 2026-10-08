import type { SortOption } from '../types/book.ts'

export const CATEGORIES = [
  { value: 'fiction', label: 'Ficción' },
  { value: 'fantasy', label: 'Fantasía' },
  { value: 'romance', label: 'Romance' },
  { value: 'mystery', label: 'Misterio' },
  { value: 'science', label: 'Ciencia' },
  { value: 'history', label: 'Historia' },
  { value: 'biography', label: 'Biografía' },
  { value: 'poetry', label: 'Poesía' },
]

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'popular', label: 'Popularidad' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'author', label: 'Autor (A-Z)' },
]
