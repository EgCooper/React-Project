import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { OPEN_LIBRARY_URL, SEARCH_URL, searchResponse } from '../support/openLibraryMocks.ts'
import { server } from '../support/server.ts'
import { getBookDetail, getCoverUrl, searchBooks } from '../../src/api/openLibrary.ts'

// Responde la búsqueda y guarda los parámetros que envió la app
function captureSearch(response: () => Response) {
  const requests: URLSearchParams[] = []
  server.use(
    http.get(SEARCH_URL, ({ request }) => {
      requests.push(new URL(request.url).searchParams)
      return response()
    }),
  )
  return requests
}

describe('searchBooks', () => {
  it('pide la página y los campos correctos y convierte la respuesta', async () => {
    const requests = captureSearch(() =>
      HttpResponse.json({
        numFound: 2,
        docs: [
          { key: '/works/OL1W', title: 'Ficciones', author_name: ['Borges'], cover_i: 10, first_publish_year: 1944 },
          { key: '/works/OL2W', title: 'Anónimo' },
        ],
      }),
    )

    const result = await searchBooks({ query: 'borges', page: 2, subject: null, sort: 'relevance' })

    expect(requests[0].get('q')).toBe('borges')
    expect(requests[0].get('page')).toBe('2')
    expect(requests[0].get('limit')).toBe('14')
    expect(requests[0].get('fields')).toBe('key,title,author_name,cover_i,first_publish_year')
    expect(requests[0].has('sort')).toBe(false)
    expect(requests[0].has('subject')).toBe(false)
    // Los campos que faltan quedan como [] o null, nunca undefined
    expect(result).toEqual({
      total: 2,
      books: [
        { id: 'OL1W', title: 'Ficciones', authors: ['Borges'], coverId: 10, firstPublishYear: 1944 },
        { id: 'OL2W', title: 'Anónimo', authors: [], coverId: null, firstPublishYear: null },
      ],
    })
  })

  it('agrega la categoría y el orden por popularidad', async () => {
    const requests = captureSearch(() => searchResponse([]))

    await searchBooks({ query: 'magia', page: 1, subject: 'fantasy', sort: 'popular' })

    expect(requests[0].get('subject')).toBe('fantasy')
    expect(requests[0].get('sort')).toBe('readinglog')
  })

  it('al ordenar por fecha descarta años imposibles agregando un rango a la búsqueda', async () => {
    const requests = captureSearch(() => searchResponse([]))

    await searchBooks({ query: 'historia', page: 1, subject: null, sort: 'newest' })

    expect(requests[0].get('sort')).toBe('new')
    expect(requests[0].get('q')).toBe(`historia first_publish_year:[1450 TO ${new Date().getFullYear()}]`)
  })

  it('ordena por autor en el navegador: ignora tildes y mayúsculas, y deja sin autor al final', async () => {
    const requests = captureSearch(() =>
      searchResponse([
        { id: 'OL1W', title: 'La sombra del viento', author: 'Zafón' },
        { id: 'OL2W', title: 'Sin autor' },
        { id: 'OL3W', title: 'Ficciones', author: 'Borges' },
        { id: 'OL4W', title: 'Cuentos', author: 'álvarez' },
      ]),
    )

    const result = await searchBooks({ query: 'cuentos', page: 1, subject: null, sort: 'author' })

    // Open Library no ordena por autor: se pide siempre el mismo bloque de 200 desde la página 1
    expect(requests[0].get('limit')).toBe('200')
    expect(requests[0].get('page')).toBe('1')
    expect(requests[0].has('sort')).toBe(false)
    expect(result.books.map((book) => book.authors[0] ?? '(sin autor)')).toEqual([
      'álvarez',
      'Borges',
      'Zafón',
      '(sin autor)',
    ])
  })

  it('al ordenar por autor recorta la página pedida del bloque ordenado', async () => {
    const books = Array.from({ length: 20 }, (_, index) => ({
      id: `OL${index + 1}W`,
      title: `Libro ${index + 1}`,
      author: `Autor ${String(index + 1).padStart(2, '0')}`,
    }))
    captureSearch(() => searchResponse(books))

    const result = await searchBooks({ query: 'libro', page: 2, subject: null, sort: 'author' })

    // Página 2 de 14 en 14: del 15 al 20
    expect(result.books.map((book) => book.authors[0])).toEqual([
      'Autor 15',
      'Autor 16',
      'Autor 17',
      'Autor 18',
      'Autor 19',
      'Autor 20',
    ])
  })

  it('al ordenar por autor guarda el bloque: cambiar de página no vuelve a pedirlo', async () => {
    const books = Array.from({ length: 20 }, (_, index) => ({ id: `OL${index + 1}W`, title: `Libro ${index + 1}` }))
    const requests = captureSearch(() => searchResponse(books))

    await searchBooks({ query: 'cache', page: 1, subject: null, sort: 'author' })
    const page2 = await searchBooks({ query: 'cache', page: 2, subject: null, sort: 'author' })

    expect(requests).toHaveLength(1)
    expect(page2.books).toHaveLength(6)
  })

  it('lanza un error si Open Library responde con error', async () => {
    captureSearch(() => new HttpResponse(null, { status: 500 }))

    await expect(searchBooks({ query: 'x', page: 1, subject: null, sort: 'relevance' })).rejects.toThrow(
      'Open Library respondió con estado 500',
    )
  })
})

describe('getBookDetail', () => {
  it('rechaza ids con otro formato sin hacer ninguna petición', async () => {
    // Si hiciera una petición, MSW la rechazaría (onUnhandledRequest: 'error') y la prueba fallaría
    await expect(getBookDetail('<script>')).resolves.toBeNull()
    await expect(getBookDetail('OL123')).resolves.toBeNull()
  })

  it('convierte la obra: limpia el Markdown, quita temas repetidos y omite el autor que falla', async () => {
    server.use(
      http.get(`${OPEN_LIBRARY_URL}/works/OL1W.json`, () =>
        HttpResponse.json({
          type: { key: '/type/work' },
          title: 'Harry Potter',
          description: { value: 'Una [novela](https://es.wikipedia.org) famosa \\[1\\]' },
          authors: [{ author: { key: '/authors/OL1A' } }, { author: { key: '/authors/OL2A' } }],
          subjects: ['Magia', 'Magia', 'place:Londres', 'Escuela'],
          covers: [-1, 123],
        }),
      ),
      http.get(`${OPEN_LIBRARY_URL}/authors/OL1A.json`, () => HttpResponse.json({ name: 'J. K. Rowling' })),
      http.get(`${OPEN_LIBRARY_URL}/authors/OL2A.json`, () => new HttpResponse(null, { status: 500 })),
    )

    await expect(getBookDetail('OL1W')).resolves.toEqual({
      id: 'OL1W',
      title: 'Harry Potter',
      authors: ['J. K. Rowling'],
      description: 'Una novela famosa [1]',
      subjects: ['Magia', 'Escuela'],
      coverId: 123,
    })
  })

  it('quita el énfasis, las líneas separadoras y los saltos de línea de más', async () => {
    server.use(
      http.get(`${OPEN_LIBRARY_URL}/works/OL5W.json`, () =>
        HttpResponse.json({
          type: { key: '/type/work' },
          title: 'Cien años de soledad',
          // Formato real de Open Library: \r\n, *cursiva*, **negrita**, _cursiva_ y una línea ----------
          description:
            '*Cien años de soledad* es una **novela** de _García Márquez_.\r\n\r\n\r\n----------\r\n\r\n\r\n' +
            'Versión en inglés. 2*3*4, archivo_final y un \\*asterisco\\* escapado.',
        }),
      ),
    )

    const book = await getBookDetail('OL5W')

    expect(book?.description).toBe(
      'Cien años de soledad es una novela de García Márquez.\n\n' +
        'Versión en inglés. 2*3*4, archivo_final y un *asterisco* escapado.',
    )
  })

  it('sigue la redirección de una obra fusionada', async () => {
    server.use(
      http.get(`${OPEN_LIBRARY_URL}/works/OL1W.json`, () =>
        HttpResponse.json({ type: { key: '/type/redirect' }, location: '/works/OL2W' }),
      ),
      http.get(`${OPEN_LIBRARY_URL}/works/OL2W.json`, () =>
        HttpResponse.json({ type: { key: '/type/work' }, title: 'Obra correcta', description: 'Texto simple' }),
      ),
    )

    const book = await getBookDetail('OL1W')

    expect(book?.title).toBe('Obra correcta')
    expect(book?.description).toBe('Texto simple')
  })

  it('devuelve null si la obra no existe (404)', async () => {
    server.use(http.get(`${OPEN_LIBRARY_URL}/works/OL9W.json`, () => new HttpResponse(null, { status: 404 })))

    await expect(getBookDetail('OL9W')).resolves.toBeNull()
  })

  it('lanza un error si Open Library falla (500)', async () => {
    server.use(http.get(`${OPEN_LIBRARY_URL}/works/OL9W.json`, () => new HttpResponse(null, { status: 500 })))

    await expect(getBookDetail('OL9W')).rejects.toThrow('Open Library respondió con estado 500')
  })
})

describe('getCoverUrl', () => {
  it('arma la URL de la portada con el tamaño pedido y sin imagen de reemplazo', () => {
    // ?default=false: si no existe, Open Library responde 404 y BookCover muestra "Sin portada"
    expect(getCoverUrl(123)).toBe('https://covers.test/b/id/123-M.jpg?default=false')
    expect(getCoverUrl(123, 'L')).toBe('https://covers.test/b/id/123-L.jpg?default=false')
  })
})
