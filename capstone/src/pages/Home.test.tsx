import { screen, waitFor, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { SUPABASE_REST_URL } from '../test/handlers.ts'
import { SEARCH_URL, searchResponse } from '../test/openLibraryMocks.ts'
import { renderApp } from '../test/renderApp.tsx'
import { server } from '../test/server.ts'

const DEFAULT_BOOKS = [
  { id: 'OL1W', title: 'Cien años de soledad', author: 'Gabriel García Márquez' },
  { id: 'OL2W', title: 'Rayuela', author: 'Julio Cortázar' },
]

// Responde /search.json con `respond` y guarda los parámetros de cada petición
function mockSearch(respond: (params: URLSearchParams) => Response | Promise<Response>) {
  const requests: URLSearchParams[] = []
  server.use(
    http.get(SEARCH_URL, ({ request }) => {
      const params = new URL(request.url).searchParams
      requests.push(params)
      return respond(params)
    }),
  )
  return requests
}

describe('Catálogo (integración)', () => {
  it('carga el catálogo inicial con la búsqueda por defecto', async () => {
    const requests = mockSearch(() => searchResponse(DEFAULT_BOOKS))
    renderApp('/')

    // Primera carga: el role="status" avisa y se ven tarjetas de relleno
    expect(screen.getByRole('status')).toHaveTextContent('Cargando libros...')

    expect(await screen.findByRole('link', { name: 'Cien años de soledad' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Rayuela' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2 resultados')
    expect(requests[0].get('q')).toBe('language:spa')
    expect(document.title).toBe('Catálogo · Biblioteca Universitaria')
  })

  it('buscar muestra los resultados nuevos y atenúa los anteriores mientras carga', async () => {
    mockSearch(async (params) => {
      if (params.get('q') === 'harry') {
        await delay(150)
        return searchResponse([{ id: 'OL3W', title: 'Harry Potter', author: 'J. K. Rowling' }])
      }
      return searchResponse(DEFAULT_BOOKS)
    })
    const { user } = renderApp('/')
    const oldCard = await screen.findByRole('link', { name: 'Cien años de soledad' })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar libros' }), 'harry')

    // Tras la espera del debounce empieza la búsqueda: los resultados anteriores siguen visibles, atenuados
    await screen.findByText('Cargando libros...')
    expect(oldCard.closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true')

    const newCard = await screen.findByRole('link', { name: 'Harry Potter' })
    expect(newCard.closest('[aria-busy]')).toHaveAttribute('aria-busy', 'false')
    expect(screen.queryByRole('link', { name: 'Cien años de soledad' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 resultados para «harry»')
  })

  it('muestra la disponibilidad de cada libro con una sola consulta para toda la página', async () => {
    const availabilityRequests: unknown[] = []
    mockSearch(() => searchResponse(DEFAULT_BOOKS))
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/get_availability`, async ({ request }) => {
        availabilityRequests.push(await request.json())
        return HttpResponse.json([{ work_id: 'OL2W', due_at: '2026-12-01T12:00:00Z', queue_length: 0, my_queue_position: null }])
      }),
    )
    renderApp('/')

    const cards = await screen.findAllByRole('article')
    expect(await within(cards[0]).findByText('Disponible')).toBeInTheDocument()
    expect(within(cards[1]).getByText('Prestado')).toBeInTheDocument()
    expect(availabilityRequests).toEqual([{ work_ids: ['OL1W', 'OL2W'] }])
  })

  it('filtrar por categoría envía la categoría a Open Library', async () => {
    const requests = mockSearch(() => searchResponse(DEFAULT_BOOKS))
    const { user } = renderApp('/')
    await screen.findByRole('link', { name: 'Rayuela' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), 'Ciencia')

    await waitFor(() => expect(requests.at(-1)?.get('subject')).toBe('science'))
  })

  it('"Siguiente" pide la página 2 y sube al inicio de la página', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const requests = mockSearch(() => searchResponse(DEFAULT_BOOKS, 30))
    const { user } = renderApp('/')
    // 30 resultados de 14 en 14 = 3 páginas
    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument()
    expect(requests.at(-1)?.get('page')).toBe('2')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
  })

  it('sin resultados muestra el estado vacío y "Limpiar" vuelve al catálogo', async () => {
    mockSearch((params) => (params.get('q') === 'zzz' ? searchResponse([]) : searchResponse(DEFAULT_BOOKS)))
    const { user } = renderApp('/?q=zzz')

    expect(await screen.findByText('No se encontraron libros')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda y filtros' }))

    expect(screen.getByRole('searchbox', { name: 'Buscar libros' })).toHaveValue('')
    expect(await screen.findByRole('link', { name: 'Rayuela' })).toBeInTheDocument()
  })

  it('si Open Library falla muestra la alerta y "Reintentar" vuelve a cargar', async () => {
    let calls = 0
    mockSearch(() => {
      calls += 1
      return calls === 1 ? new HttpResponse(null, { status: 500 }) : searchResponse(DEFAULT_BOOKS)
    })
    const { user } = renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los libros. Intenta de nuevo.')

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('link', { name: 'Cien años de soledad' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
