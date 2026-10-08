import type { BookSummary, SortOption} from '../types/book.ts'

const API_URL = import.meta.env.VITE_OPEN_LIBRARY_URL
const COVERS_URL = import.meta.env.VITE_COVERS_URL

export const PAGE_SIZE = 20
const SEARCH_FIELDS = 'key,title,author_name,cover_i,first_publish_year'

// Traduce el orden de la app al parametro `sort` de Open Library (null = orden por defecto)
const SORT_PARAMS: Record<SortOption, string | null> = {
  relevance: null,
  popular: 'readinglog',
  newest: 'new',
  oldest: 'old',
}

// Open Library tiene anios erroneos (0, 19, 2542...); al ordenar por fecha solo usamos anios plausibles
const VALID_YEARS = `first_publish_year:[1450 TO ${new Date().getFullYear()}]`

interface SearchDoc {
  key: string
  title: string
  author_name?: string[]
  cover_i?: number
  first_publish_year?: number
}

interface SearchResponse {
  numFound: number
  docs: SearchDoc[]
}

export interface BookSearchOptions {
  query: string
  page: number
  subject: string | null
  sort: SortOption
}

export interface BookSearchResult {
  books: BookSummary[]
  total: number
}
// openLibrary to app
function toBookSummary(doc: SearchDoc): BookSummary {
  return {
    id: doc.key.replace('/works/', ''),
    title: doc.title,
    authors: doc.author_name ?? [],
    coverId: doc.cover_i ?? null,
    firstPublishYear: doc.first_publish_year ?? null,
  }
}

export async function searchBooks(
  { query, page, subject, sort }: BookSearchOptions,
  signal?: AbortSignal,
): Promise<BookSearchResult> {
  const isDateSort = sort === 'newest' || sort === 'oldest'
  const sortParam = SORT_PARAMS[sort]

  const params = new URLSearchParams({
    q: isDateSort ? `${query} ${VALID_YEARS}` : query,
    page: String(page),
    limit: String(PAGE_SIZE),
    fields: SEARCH_FIELDS,
  })

  if (subject) {
    params.set('subject', subject)
  }

  if (sortParam) {
    params.set('sort', sortParam)
  }

  const response = await fetch(`${API_URL}/search.json?${params}`, { signal })

  if (!response.ok) {
    throw new Error(`Open Library respondió con estado ${response.status}`)
  }

  const data: SearchResponse = await response.json()

  return {
    books: data.docs.map(toBookSummary),
    total: data.numFound,
  }
}

export function getCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `${COVERS_URL}/b/id/${coverId}-${size}.jpg`
}
