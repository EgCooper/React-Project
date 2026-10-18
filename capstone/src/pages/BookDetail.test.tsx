import { screen, waitFor, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { OPEN_LIBRARY_URL, SEARCH_URL, searchResponse } from '../test/openLibraryMocks.ts'
import { renderApp } from '../test/renderApp.tsx'
import { server } from '../test/server.ts'

const WORK = {
  type: { key: '/type/work' },
  title: 'Ficciones',
  description: 'Cuentos fantásticos.',
  authors: [{ author: { key: '/authors/OL1A' } }],
  subjects: ['Cuentos', 'Literatura argentina'],
  covers: [123],
}

function mockWork(respond: () => Response | Promise<Response>) {
  server.use(
    http.get(`${OPEN_LIBRARY_URL}/works/OL1W.json`, respond),
    http.get(`${OPEN_LIBRARY_URL}/authors/OL1A.json`, () => HttpResponse.json({ name: 'Jorge Luis Borges' })),
  )
}

describe('Detalle del libro (integración)', () => {
  it('desde el catálogo abre el libro, muestra su información y maneja el foco al ir y volver', async () => {
    server.use(http.get(SEARCH_URL, () => searchResponse([{ id: 'OL1W', title: 'Ficciones', author: 'Borges' }])))
    // 100 ms de demora: da tiempo a comprobar el estado de carga
    mockWork(async () => {
      await delay(100)
      return HttpResponse.json(WORK)
    })
    const { user } = renderApp('/')

    await user.click(await screen.findByRole('link', { name: 'Ficciones' }))

    // Al cambiar de página el foco va al <main> (el h1 aún no existe mientras carga)
    expect(screen.getByRole('main')).toHaveFocus()
    // La página se descarga con React.lazy y luego muestra su propio estado de carga
    expect(await screen.findByText('Cargando libro...')).toBeInTheDocument()

    expect(await screen.findByRole('heading', { level: 1, name: 'Ficciones' })).toBeInTheDocument()
    expect(screen.getByText('Jorge Luis Borges')).toBeInTheDocument()
    expect(screen.getByText('Cuentos fantásticos.')).toBeInTheDocument()
    const subjects = within(screen.getByRole('list', { name: 'Géneros' })).getAllByRole('listitem')
    expect(subjects.map((item) => item.textContent)).toEqual(['Cuentos', 'Literatura argentina'])
    expect(screen.getByRole('img', { name: 'Portada de Ficciones' })).toHaveAttribute(
      'src',
      'https://covers.test/b/id/123-L.jpg?default=false',
    )
    expect(document.title).toBe('Ficciones · Biblioteca Universitaria')
    // Disponibilidad (requisito 1): sin sesión se ve el estado y se invita a iniciar sesión
    expect(await screen.findByText('Disponible para préstamo.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicia sesión' })).toBeInTheDocument()

    // "Volver" regresa al catálogo y el foco queda en su h1
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Catálogo' })).toHaveFocus())
  })

  it('abierto por URL directa: ofrece "Ir al catálogo" y avisa si el libro no existe', async () => {
    server.use(http.get(`${OPEN_LIBRARY_URL}/works/OL404W.json`, () => new HttpResponse(null, { status: 404 })))
    renderApp('/libro/OL404W')

    expect(await screen.findByRole('link', { name: 'Ir al catálogo' })).toHaveAttribute('href', '/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Libro no encontrado' })).toBeInTheDocument()
    expect(document.title).toBe('Libro no encontrado · Biblioteca Universitaria')
  })

  it('si Open Library falla muestra la alerta y "Reintentar" carga el libro', async () => {
    let calls = 0
    mockWork(() => {
      calls += 1
      return calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(WORK)
    })
    const { user } = renderApp('/libro/OL1W')

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el libro.')

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Ficciones' })).toBeInTheDocument()
  })
})
