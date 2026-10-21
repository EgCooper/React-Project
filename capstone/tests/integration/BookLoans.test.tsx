import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supabase } from '../../src/api/supabase.ts'
import { signInTestUser } from '../support/auth.ts'
import { SUPABASE_REST_URL } from '../support/handlers.ts'
import { daysFromNow, loanRow, reservationRow } from '../support/libraryMocks.ts'
import { OPEN_LIBRARY_URL } from '../support/openLibraryMocks.ts'
import { renderApp } from '../support/renderApp.tsx'
import { server } from '../support/server.ts'

const WORK = { type: { key: '/type/work' }, title: 'Ficciones', covers: [123] }

describe('Préstamos desde el detalle del libro (integración)', () => {
  beforeEach(async () => {
    server.use(http.get(`${OPEN_LIBRARY_URL}/works/OL1W.json`, () => HttpResponse.json(WORK)))
    await signInTestUser()
  })

  afterEach(async () => {
    await supabase.auth.signOut()
  })

  it('pide prestado el libro y luego lo devuelve, sin perder el foco del botón', async () => {
    let borrowBody: unknown
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/borrow_book`, async ({ request }) => {
        borrowBody = await request.json()
        return HttpResponse.json(loanRow(7, 'OL1W', 'Ficciones', { borrowed_at: daysFromNow(0), due_at: daysFromNow(14) }))
      }),
      http.post(`${SUPABASE_REST_URL}/rpc/return_book`, () =>
        HttpResponse.json(loanRow(7, 'OL1W', 'Ficciones', { returned_at: daysFromNow(0) })),
      ),
    )
    const { user } = renderApp('/book/OL1W')

    expect(await screen.findByText('Available to borrow.')).toBeInTheDocument()
    expect(screen.getByText('Loan period: 14 days.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Borrow' }))

    expect(await screen.findByText(/^You have it until/)).toBeInTheDocument()
    expect(screen.getByText(/^Done! Please return it by/)).toBeInTheDocument()
    expect(borrowBody).toEqual({ p_work_id: 'OL1W', p_title: 'Ficciones', p_cover_id: 123 })
    // El mismo botón cambia de texto: quien navega con teclado no pierde su lugar
    expect(screen.getByRole('button', { name: 'Return' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Return' }))

    expect(await screen.findByText('You returned the book. Thank you!')).toBeInTheDocument()
    expect(await screen.findByText('Available to borrow.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Borrow' })).toBeInTheDocument()
  })

  it('si otra persona lo tiene, permite reservarlo y cancelar la reserva', async () => {
    let reserved = false
    server.use(
      // La disponibilidad cambia según si el usuario ya reservó
      http.post(`${SUPABASE_REST_URL}/rpc/get_availability`, () =>
        HttpResponse.json([
          {
            work_id: 'OL1W',
            due_at: daysFromNow(5),
            queue_length: reserved ? 2 : 1,
            my_queue_position: reserved ? 2 : null,
          },
        ]),
      ),
      http.post(`${SUPABASE_REST_URL}/rpc/reserve_book`, () => {
        reserved = true
        return HttpResponse.json(reservationRow(3, 'OL1W', 'Ficciones'))
      }),
      http.post(`${SUPABASE_REST_URL}/rpc/cancel_reservation`, () => {
        reserved = false
        return HttpResponse.json(reservationRow(3, 'OL1W', 'Ficciones'))
      }),
    )
    const { user } = renderApp('/book/OL1W')

    expect(await screen.findByText(/^On loan until/)).toBeInTheDocument()
    expect(screen.getByText('1 person in line.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reserve' }))

    expect(await screen.findByText('2 people in line. You’re number 2.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('You joined the line.')

    await user.click(screen.getByRole('button', { name: 'Cancel reservation' }))

    expect(await screen.findByRole('button', { name: 'Reserve' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('You canceled your reservation.')
  })

  it('muestra el mensaje de la regla que no se cumple (ej. límite de préstamos)', async () => {
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/borrow_book`, () =>
        HttpResponse.json(
          { code: 'P0001', message: 'You already have 3 active loans. Return one to borrow another.', details: null, hint: null },
          { status: 400 },
        ),
      ),
    )
    const { user } = renderApp('/book/OL1W')

    await user.click(await screen.findByRole('button', { name: 'Borrow' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('You already have 3 active loans. Return one to borrow another.')
  })

  it('guarda y quita el estado de lectura', async () => {
    const savedStatuses: unknown[] = []
    let deleted = false
    server.use(
      http.post(`${SUPABASE_REST_URL}/reading_status`, async ({ request }) => {
        const body = (await request.json()) as { status: string }
        savedStatuses.push(body.status)
        return HttpResponse.json({ work_id: 'OL1W', title: 'Ficciones', cover_id: 123, status: body.status })
      }),
      http.delete(`${SUPABASE_REST_URL}/reading_status`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderApp('/book/OL1W')
    const select = await screen.findByRole('combobox', { name: 'My reading status' })

    await user.selectOptions(select, 'Reading')

    expect(await screen.findByDisplayValue('Reading')).toBeInTheDocument()
    expect(savedStatuses).toEqual(['reading'])

    await user.selectOptions(select, 'No status')

    expect(await screen.findByDisplayValue('No status')).toBeInTheDocument()
    expect(deleted).toBe(true)
  })
})
