import type { BookDetail, BookSummary, SortOption } from '../types/book.ts'

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

// Formato de los IDs de obra de Open Library: OL + digitos + W (ej. OL82563W)
const WORK_ID = /^OL\d+W$/
const MAX_AUTHORS = 5
const MAX_SUBJECTS = 10

// [texto](url) -> texto, y \[ -> [ (Markdown que traen algunas descripciones)
const MARKDOWN_LINK = /\[((?:\\.|[^\\\]])*)\]\([^)]*\)/g
const MARKDOWN_ESCAPE = /\\([\\[\]()*_])/g

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

interface WorkResponse {
  type: { key: string }
  location?: string
  title?: string
  description?: string | { value: string }
  authors?: { author?: { key: string } }[]
  subjects?: string[]
  covers?: number[]
}

interface AuthorResponse {
  name?: string
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

function toPlainText(text: string): string {
  return text.replace(MARKDOWN_LINK, '$1').replace(MARKDOWN_ESCAPE, '$1').trim()
}

// null = la obra no existe (404); un error de red o del servidor lanza una excepcion
async function fetchWork(id: string, signal?: AbortSignal): Promise<WorkResponse | null> {
  const response = await fetch(`${API_URL}/works/${id}.json`, { signal })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Open Library respondió con estado ${response.status}`)
  }

  return response.json()
}

// El autor es un dato secundario: si falla, se omite en lugar de romper la pagina
async function getAuthorName(key: string, signal?: AbortSignal): Promise<string | null> {
  const response = await fetch(`${API_URL}${key}.json`, { signal })

  if (!response.ok) {
    return null
  }

  const data: AuthorResponse = await response.json()
  return data.name ?? null
}

export async function getBookDetail(id: string, signal?: AbortSignal): Promise<BookDetail | null> {
  if (!WORK_ID.test(id)) {
    return null
  }

  let work = await fetchWork(id, signal)

  // Obras fusionadas: Open Library devuelve una redireccion con la obra correcta en `location`
  if (work?.type.key === '/type/redirect' && work.location) {
    work = await fetchWork(work.location.replace('/works/', ''), signal)
  }

  if (!work || work.type.key !== '/type/work') {
    return null
  }

  const authorKeys = (work.authors ?? [])
    .map((entry) => entry.author?.key)
    .filter((key) => key !== undefined)
    .slice(0, MAX_AUTHORS)
  // Todos los autores en paralelo, no uno detras de otro
  const authorNames = await Promise.all(authorKeys.map((key) => getAuthorName(key, signal)))

  const description = typeof work.description === 'string' ? work.description : work.description?.value

  return {
    id,
    title: work.title ?? 'Sin título',
    authors: authorNames.filter((name) => name !== null),
    description: description ? toPlainText(description) : null,
    subjects: [...new Set(work.subjects ?? [])]
      .filter((subject) => !subject.includes(':'))
      .slice(0, MAX_SUBJECTS),
    coverId: work.covers?.find((cover) => cover > 0) ?? null,
  }
}
