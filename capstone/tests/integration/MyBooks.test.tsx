import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supabase } from '../../src/api/supabase.ts'
import { signInTestUser } from '../support/auth.ts'
import { SUPABASE_REST_URL } from '../support/handlers.ts'
import { daysFromNow } from '../support/libraryMocks.ts'
import { renderApp } from '../support/renderApp.tsx'
import { server } from '../support/server.ts'

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
    renderApp('/my-books')

    const wishlist = await screen.findByRole('region', { name: /Wishlist/ })
    expect(await within(wishlist).findByText('Available! Open it to borrow it.')).toBeInTheDocument()
    expect(within(wishlist).getByText(/^On loan until/)).toBeInTheDocument()
    expect(within(wishlist).getByText('1 available')).toBeInTheDocument()

    // El aviso del menú se lee completo con lector de pantalla
    expect(await screen.findByRole('link', { name: 'My books, 1 book from your wishlist available' })).toBeInTheDocument()

    expect(within(screen.getByRole('region', { name: 'Reading' })).getByRole('link', { name: 'El Aleph' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Completed' })).getByRole('link', { name: 'Pedro Páramo' })).toBeInTheDocument()
  })

  it('quitar un libro de la lista también actualiza el aviso del menú', async () => {
    let deletedUrl: URL | undefined
    server.use(
      http.delete(`${SUPABASE_REST_URL}/reading_status`, ({ request }) => {
        deletedUrl = new URL(request.url)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderApp('/my-books')

    await user.click(await screen.findByRole('button', { name: 'Remove Ficciones from your books' }))

    expect(await screen.findByText('You removed “Ficciones”.')).toBeInTheDocument()
    expect(deletedUrl?.searchParams.get('work_id')).toBe('eq.OL1W')
    expect(screen.getByRole('link', { name: 'My books' })).toBeInTheDocument()
  })
})
