import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supabase } from '../../src/api/supabase.ts'
import { signInTestUser } from '../support/auth.ts'
import { SUPABASE_REST_URL } from '../support/handlers.ts'
import { daysFromNow, loanRow, reservationRow } from '../support/libraryMocks.ts'
import { renderApp } from '../support/renderApp.tsx'
import { server } from '../support/server.ts'

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
    renderApp('/my-loans')

    const active = await screen.findByRole('region', { name: /Active loans/ })
    expect(within(active).getByText('2 of 3')).toBeInTheDocument()
    expect(within(active).getByText(/^Was due on .+ Please return it as soon as possible\.$/)).toBeInTheDocument()
    expect(within(active).getByText(/^Return by/)).toBeInTheDocument()

    const reservations = screen.getByRole('region', { name: 'Reservations' })
    expect(await within(reservations).findByText('Number 2 of 3 in line')).toBeInTheDocument()

    const history = screen.getByRole('region', { name: 'History' })
    expect(within(history).getByRole('link', { name: 'El Aleph' })).toBeInTheDocument()
    expect(within(history).getByText(/^From .+ to .+$/)).toBeInTheDocument()
  })

  it('al devolver, el libro pasa al historial y el foco vuelve al título', async () => {
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/return_book`, () =>
        HttpResponse.json(loanRow(2, 'OL2W', 'Ficciones', { borrowed_at: daysFromNow(-20), due_at: daysFromNow(-6), returned_at: daysFromNow(0) })),
      ),
    )
    const { user } = renderApp('/my-loans')

    await user.click(await screen.findByRole('button', { name: 'Return Ficciones' }))

    expect(await screen.findByText('You returned “Ficciones”.')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: /Active loans/ })).getByText('1 of 3')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'History' })).getByRole('link', { name: 'Ficciones' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'My loans' })).toHaveFocus()
  })

  it('cancela una reserva', async () => {
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/cancel_reservation`, () => HttpResponse.json(reservationRow(9, 'OL9W', 'Pedro Páramo'))),
    )
    const { user } = renderApp('/my-loans')

    await user.click(await screen.findByRole('button', { name: 'Cancel reservation for Pedro Páramo' }))

    expect(await screen.findByText(/^You have no reservations/)).toBeInTheDocument()
  })
})
