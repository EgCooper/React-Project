import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supabase } from '../api/supabase.ts'
import { signInTestUser } from '../test/auth.ts'
import { SUPABASE_REST_URL } from '../test/handlers.ts'
import { daysFromNow } from '../test/libraryMocks.ts'
import { renderApp } from '../test/renderApp.tsx'
import { server } from '../test/server.ts'

function readingRow(workId: string, title: string, status: string) {
  return { work_id: workId, title, cover_id: null, status }
}

describe('Mis libros y aviso de la lista de deseos (integración)', () => {
  beforeEach(async () => {
    server.use(
      http.get(`${SUPABASE_REST_URL}/reading_status`, () =>
        HttpResponse.json([
          readingRow('OL1W', 'Ficciones', 'wishlist'),
          readingRow('OL2W', 'Rayuela', 'wishlist'),
          readingRow('OL3W', 'El Aleph', 'reading'),
          readingRow('OL4W', 'Pedro Páramo', 'completed'),
        ]),
      ),
      // Ficciones no aparece = disponible; Rayuela está prestado
      http.post(`${SUPABASE_REST_URL}/rpc/get_availability`, () =>
        HttpResponse.json([{ work_id: 'OL2W', due_at: daysFromNow(5), queue_length: 0, my_queue_position: null }]),
      ),
    )
    await signInTestUser()
  })

  afterEach(async () => {
    await supabase.auth.signOut()
  })

  it('avisa qué libros de la lista de deseos están disponibles, también en el menú', async () => {
    renderApp('/mis-libros')

    const wishlist = await screen.findByRole('region', { name: /Lista de deseos/ })
    expect(await within(wishlist).findByText('¡Disponible! Ábrelo para pedirlo prestado.')).toBeInTheDocument()
    expect(within(wishlist).getByText(/^Prestado hasta el/)).toBeInTheDocument()
    expect(within(wishlist).getByText('1 disponible')).toBeInTheDocument()

    // El aviso del menú se lee completo con lector de pantalla
    expect(await screen.findByRole('link', { name: 'Mis libros, 1 libro de tu lista disponible' })).toBeInTheDocument()

    expect(within(screen.getByRole('region', { name: 'Leyendo' })).getByRole('link', { name: 'El Aleph' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Completados' })).getByRole('link', { name: 'Pedro Páramo' })).toBeInTheDocument()
  })

  it('quitar un libro de la lista también actualiza el aviso del menú', async () => {
    let deletedUrl: URL | undefined
    server.use(
      http.delete(`${SUPABASE_REST_URL}/reading_status`, ({ request }) => {
        deletedUrl = new URL(request.url)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderApp('/mis-libros')

    await user.click(await screen.findByRole('button', { name: 'Quitar Ficciones de tus libros' }))

    expect(await screen.findByText('Quitaste «Ficciones».')).toBeInTheDocument()
    expect(deletedUrl?.searchParams.get('work_id')).toBe('eq.OL1W')
    expect(screen.getByRole('link', { name: 'Mis libros' })).toBeInTheDocument()
  })
})
