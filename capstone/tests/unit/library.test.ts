import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { SUPABASE_REST_URL as REST_URL } from '../support/handlers.ts'
import { server } from '../support/server.ts'
import {
  borrowBook,
  getAvailability,
  getLibraryErrorMessage,
  getMyLoans,
  removeReadingStatus,
  saveReadingStatus,
} from '../../src/api/library.ts'

const BOOK = { id: 'OL1W', title: 'Ficciones', coverId: 123 }

const LOAN_ROW = {
  id: 7,
  user_id: '11111111-1111-1111-1111-111111111111',
  work_id: 'OL1W',
  title: 'Ficciones',
  cover_id: 123,
  borrowed_at: '2026-10-01T10:00:00+00:00',
  due_at: '2026-10-15T10:00:00+00:00',
  returned_at: null,
}

describe('library: lecturas', () => {
  it('getMyLoans pide los préstamos más recientes primero y los convierte a camelCase', async () => {
    let url: URL | undefined
    server.use(
      http.get(`${REST_URL}/loans`, ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json([LOAN_ROW])
      }),
    )

    const loans = await getMyLoans()

    expect(url?.searchParams.get('order')).toBe('borrowed_at.desc')
    expect(loans).toEqual([
      {
        id: 7,
        workId: 'OL1W',
        title: 'Ficciones',
        coverId: 123,
        borrowedAt: '2026-10-01T10:00:00+00:00',
        dueAt: '2026-10-15T10:00:00+00:00',
        returnedAt: null,
      },
    ])
  })

  it('getAvailability consulta todos los libros de la página en una sola llamada', async () => {
    let body: unknown
    server.use(
      http.post(`${REST_URL}/rpc/get_availability`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json([
          { work_id: 'OL1W', due_at: '2026-10-15T10:00:00+00:00', queue_length: 2, my_queue_position: null },
        ])
      }),
    )

    const availability = await getAvailability(['OL1W', 'OL2W'])

    expect(body).toEqual({ work_ids: ['OL1W', 'OL2W'] })
    expect(availability).toEqual([
      { workId: 'OL1W', dueAt: '2026-10-15T10:00:00+00:00', queueLength: 2, myQueuePosition: null },
    ])
  })
})

describe('library: escrituras', () => {
  it('borrowBook llama a la función borrow_book con los parámetros p_...', async () => {
    let body: unknown
    server.use(
      http.post(`${REST_URL}/rpc/borrow_book`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(LOAN_ROW)
      }),
    )

    const loan = await borrowBook(BOOK)

    expect(body).toEqual({ p_work_id: 'OL1W', p_title: 'Ficciones', p_cover_id: 123 })
    expect(loan.dueAt).toBe('2026-10-15T10:00:00+00:00')
  })

  it('saveReadingStatus hace upsert por (user_id, work_id) sin enviar user_id', async () => {
    let url: URL | undefined
    let prefer: string | null = null
    let body: unknown
    server.use(
      http.post(`${REST_URL}/reading_status`, async ({ request }) => {
        url = new URL(request.url)
        prefer = request.headers.get('prefer')
        body = await request.json()
        return HttpResponse.json({ work_id: 'OL1W', title: 'Ficciones', cover_id: 123, status: 'reading' })
      }),
    )

    const entry = await saveReadingStatus(BOOK, 'reading')

    expect(url?.searchParams.get('on_conflict')).toBe('user_id,work_id')
    expect(prefer).toContain('resolution=merge-duplicates')
    expect(body).toEqual({ work_id: 'OL1W', title: 'Ficciones', cover_id: 123, status: 'reading' })
    expect(entry).toEqual({ workId: 'OL1W', title: 'Ficciones', coverId: 123, status: 'reading' })
  })

  it('removeReadingStatus borra solo ese libro', async () => {
    let url: URL | undefined
    server.use(
      http.delete(`${REST_URL}/reading_status`, ({ request }) => {
        url = new URL(request.url)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await removeReadingStatus('OL1W')

    expect(url?.searchParams.get('work_id')).toBe('eq.OL1W')
  })
})

describe('getLibraryErrorMessage', () => {
  it('muestra tal cual los mensajes de las reglas de negocio (código P0001)', async () => {
    server.use(
      http.post(`${REST_URL}/rpc/borrow_book`, () =>
        HttpResponse.json(
          { code: 'P0001', message: 'Ya tienes 3 préstamos activos. Devuelve uno para pedir otro.', details: null, hint: null },
          { status: 400 },
        ),
      ),
    )

    const error = await borrowBook(BOOK).catch((caught: unknown) => caught)

    expect(error).toMatchObject({ code: 'P0001' })
    expect(getLibraryErrorMessage(error)).toBe('Ya tienes 3 préstamos activos. Devuelve uno para pedir otro.')
  })

  it('oculta los errores técnicos detrás de un mensaje genérico', async () => {
    server.use(
      http.post(`${REST_URL}/rpc/borrow_book`, () =>
        HttpResponse.json(
          { code: '23514', message: 'new row for relation "loans" violates check constraint', details: null, hint: null },
          { status: 400 },
        ),
      ),
    )

    const error = await borrowBook(BOOK).catch((caught: unknown) => caught)

    expect(getLibraryErrorMessage(error)).toBe('No se pudo completar la operación. Intenta de nuevo.')
    expect(getLibraryErrorMessage(new Error('Failed to fetch'))).toBe('No se pudo completar la operación. Intenta de nuevo.')
  })
})
