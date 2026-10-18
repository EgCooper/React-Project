import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supabase } from '../api/supabase.ts'
import { signInTestUser } from '../test/auth.ts'
import { SUPABASE_REST_URL } from '../test/handlers.ts'
import { daysFromNow, loanRow, reservationRow } from '../test/libraryMocks.ts'
import { renderApp } from '../test/renderApp.tsx'
import { server } from '../test/server.ts'

describe('Mis préstamos (integración)', () => {
  beforeEach(async () => {
    server.use(
      http.get(`${SUPABASE_REST_URL}/loans`, () =>
        HttpResponse.json([
          loanRow(3, 'OL3W', 'Rayuela'),
          loanRow(2, 'OL2W', 'Ficciones', { borrowed_at: daysFromNow(-20), due_at: daysFromNow(-6) }),
          loanRow(1, 'OL1W', 'El Aleph', { borrowed_at: daysFromNow(-40), due_at: daysFromNow(-26), returned_at: daysFromNow(-30) }),
        ]),
      ),
      http.get(`${SUPABASE_REST_URL}/reservations`, () => HttpResponse.json([reservationRow(9, 'OL9W', 'Pedro Páramo')])),
      http.post(`${SUPABASE_REST_URL}/rpc/get_availability`, () =>
        HttpResponse.json([{ work_id: 'OL9W', due_at: daysFromNow(4), queue_length: 3, my_queue_position: 2 }]),
      ),
    )
    await signInTestUser()
  })

  afterEach(async () => {
    await supabase.auth.signOut()
  })

  it('muestra préstamos activos (con el vencido marcado), reservas e historial', async () => {
    renderApp('/mis-prestamos')

    const active = await screen.findByRole('region', { name: /Préstamos activos/ })
    expect(within(active).getByText('2 de 3')).toBeInTheDocument()
    expect(within(active).getByText(/^Venció el .+ Devuélvelo cuanto antes\.$/)).toBeInTheDocument()
    expect(within(active).getByText(/^Devuélvelo antes del/)).toBeInTheDocument()

    const reservations = screen.getByRole('region', { name: 'Reservas' })
    expect(await within(reservations).findByText('Lugar 2 de 3 en la fila')).toBeInTheDocument()

    const history = screen.getByRole('region', { name: 'Historial' })
    expect(within(history).getByRole('link', { name: 'El Aleph' })).toBeInTheDocument()
    expect(within(history).getByText(/^Del .+ al .+$/)).toBeInTheDocument()
  })

  it('al devolver, el libro pasa al historial y el foco vuelve al título', async () => {
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/return_book`, () =>
        HttpResponse.json(loanRow(2, 'OL2W', 'Ficciones', { borrowed_at: daysFromNow(-20), due_at: daysFromNow(-6), returned_at: daysFromNow(0) })),
      ),
    )
    const { user } = renderApp('/mis-prestamos')

    await user.click(await screen.findByRole('button', { name: 'Devolver Ficciones' }))

    expect(await screen.findByText('Devolviste «Ficciones».')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: /Préstamos activos/ })).getByText('1 de 3')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Historial' })).getByRole('link', { name: 'Ficciones' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Mis préstamos' })).toHaveFocus()
  })

  it('cancela una reserva', async () => {
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/cancel_reservation`, () => HttpResponse.json(reservationRow(9, 'OL9W', 'Pedro Páramo'))),
    )
    const { user } = renderApp('/mis-prestamos')

    await user.click(await screen.findByRole('button', { name: 'Cancelar reserva de Pedro Páramo' }))

    expect(await screen.findByText(/^No tienes reservas/)).toBeInTheDocument()
  })
})
