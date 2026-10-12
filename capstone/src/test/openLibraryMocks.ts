import { HttpResponse } from 'msw'

// Las mismas URLs falsas que define vite.config.ts en test.env
export const OPEN_LIBRARY_URL = 'https://openlibrary.test'
export const SEARCH_URL = `${OPEN_LIBRARY_URL}/search.json`

interface MockBook {
  id: string
  title: string
  author?: string
  year?: number
}

// Respuesta de /search.json con la misma forma que la de Open Library
export function searchResponse(books: MockBook[], numFound = books.length) {
  return HttpResponse.json({
    numFound,
    docs: books.map((book) => ({
      key: `/works/${book.id}`,
      title: book.title,
      author_name: book.author ? [book.author] : undefined,
      first_publish_year: book.year,
    })),
  })
}
