import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supabase } from '../api/supabase.ts'
import { signInTestUser } from '../test/auth.ts'
import { SUPABASE_REST_URL } from '../test/handlers.ts'
import { daysFromNow, loanRow, reservationRow } from '../test/libraryMocks.ts'
import { OPEN_LIBRARY_URL } from '../test/openLibraryMocks.ts'
import { renderApp } from '../test/renderApp.tsx'
import { server } from '../test/server.ts'

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
    const { user } = renderApp('/libro/OL1W')

    expect(await screen.findByText('Disponible para préstamo.')).toBeInTheDocument()
    expect(screen.getByText('Plazo: 14 días.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pedir prestado' }))

    expect(await screen.findByText(/^Lo tienes prestado hasta el/)).toBeInTheDocument()
    expect(screen.getByText(/^¡Listo! Devuélvelo antes del/)).toBeInTheDocument()
    expect(borrowBody).toEqual({ p_work_id: 'OL1W', p_title: 'Ficciones', p_cover_id: 123 })
    // El mismo botón cambia de texto: quien navega con teclado no pierde su lugar
    expect(screen.getByRole('button', { name: 'Devolver' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Devolver' }))

    expect(await screen.findByText('Devolviste el libro. ¡Gracias!')).toBeInTheDocument()
    expect(await screen.findByText('Disponible para préstamo.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pedir prestado' })).toBeInTheDocument()
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
    const { user } = renderApp('/libro/OL1W')

    expect(await screen.findByText(/^Prestado hasta el/)).toBeInTheDocument()
    expect(screen.getByText('1 persona en la fila.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reservar' }))

    expect(await screen.findByText('2 personas en la fila. Estás en el lugar 2.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Te uniste a la fila.')

    await user.click(screen.getByRole('button', { name: 'Cancelar reserva' }))

    expect(await screen.findByRole('button', { name: 'Reservar' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Cancelaste tu reserva.')
  })

  it('muestra el mensaje de la regla que no se cumple (ej. límite de préstamos)', async () => {
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/borrow_book`, () =>
        HttpResponse.json(
          { code: 'P0001', message: 'Ya tienes 3 préstamos activos. Devuelve uno para pedir otro.', details: null, hint: null },
          { status: 400 },
        ),
      ),
    )
    const { user } = renderApp('/libro/OL1W')

    await user.click(await screen.findByRole('button', { name: 'Pedir prestado' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya tienes 3 préstamos activos. Devuelve uno para pedir otro.')
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
    const { user } = renderApp('/libro/OL1W')
    const select = await screen.findByRole('combobox', { name: 'Mi estado de lectura' })

    await user.selectOptions(select, 'Leyendo')

    expect(await screen.findByDisplayValue('Leyendo')).toBeInTheDocument()
    expect(savedStatuses).toEqual(['reading'])

    await user.selectOptions(select, 'Sin estado')

    expect(await screen.findByDisplayValue('Sin estado')).toBeInTheDocument()
    expect(deleted).toBe(true)
  })
})
