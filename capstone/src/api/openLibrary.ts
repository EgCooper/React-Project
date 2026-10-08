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
  author: null,
}

// Open Library tiene anios erroneos (0, 19, 2542...); al ordenar por fecha solo usamos anios plausibles
const VALID_YEARS = `first_publish_year:[1450 TO ${new Date().getFullYear()}]`

// Open Library no ordena por autor: pedimos este bloque de resultados y lo ordenamos en el navegador
export const AUTHOR_SORT_LIMIT = 200

const authorCollator = new Intl.Collator('es', { sensitivity: 'base' })

// Negativo: a va antes; positivo: b va antes; 0: iguales. Los libros sin autor van al final
function compareByAuthor(a: BookSummary, b: BookSummary): number {
  if (a.authors.length === 0 && b.authors.length === 0) return 0
  if (a.authors.length === 0) return 1
  if (b.authors.length === 0) return -1
  return authorCollator.compare(a.authors[0], b.authors[0])
}

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
  const isAuthorSort = sort === 'author'

  const params = new URLSearchParams({
    q: isDateSort ? `${query} ${VALID_YEARS}` : query,
    // Al ordenar por autor siempre se pide el mismo bloque; la pagina la recorta slice()
    page: isAuthorSort ? '1' : String(page),
    limit: String(isAuthorSort ? AUTHOR_SORT_LIMIT : PAGE_SIZE),
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
  const books = data.docs.map(toBookSummary)

  if (isAuthorSort) {
    const start = (page - 1) * PAGE_SIZE
    return {
      books: books.toSorted(compareByAuthor).slice(start, start + PAGE_SIZE),
      total: data.numFound,
    }
  }

  return {
    books,
    total: data.numFound,
  }
}

export function getCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `${COVERS_URL}/b/id/${coverId}-${size}.jpg`
}
