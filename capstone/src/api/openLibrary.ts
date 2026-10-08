import type { BookSummary } from '../types/book.ts'

const API_URL = import.meta.env.VITE_OPEN_LIBRARY_URL
const COVERS_URL = import.meta.env.VITE_COVERS_URL

export const PAGE_SIZE = 20
const SEARCH_FIELDS = 'key,title,author_name,cover_i,first_publish_year'

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
  { query, page }: BookSearchOptions,
  signal?: AbortSignal,
): Promise<BookSearchResult> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(PAGE_SIZE),
    fields: SEARCH_FIELDS,
  })

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
