import { describe, expect, it } from 'vitest'
import type { Loan, Reservation } from '../../src/types/library.ts'
import { initialLibraryState, libraryReducer, type LibraryState } from '../../src/context/libraryReducer.ts'

const LOAN: Loan = {
  id: 1,
  workId: 'OL1W',
  title: 'Ficciones',
  coverId: null,
  borrowedAt: '2026-10-10T12:00:00Z',
  dueAt: '2026-10-24T12:00:00Z',
  returnedAt: null,
}

const RESERVATION: Reservation = { id: 5, workId: 'OL1W', title: 'Ficciones', coverId: null, createdAt: '2026-10-01T12:00:00Z' }

function loadedState(changes: Partial<LibraryState> = {}): LibraryState {
  return { ...initialLibraryState, key: 'usuario#0', ...changes }
}

describe('libraryReducer', () => {
  it('loaded guarda los datos de esa carga', () => {
    const state = libraryReducer(initialLibraryState, {
      type: 'loaded',
      key: 'usuario#0',
      loans: [LOAN],
      reservations: [RESERVATION],
      readingList: [],
    })

    expect(state).toMatchObject({ key: 'usuario#0', failed: false, loans: [LOAN], reservations: [RESERVATION] })
  })

  it('load_failed marca el error y no deja datos viejos', () => {
    const state = libraryReducer(loadedState({ loans: [LOAN] }), { type: 'load_failed', key: 'usuario#1' })

    expect(state).toMatchObject({ key: 'usuario#1', failed: true, loans: [] })
  })

  it('loan_added agrega el préstamo primero, cumple la reserva de ese libro y sube la revisión', () => {
    const state = libraryReducer(loadedState({ reservations: [RESERVATION] }), { type: 'loan_added', loan: LOAN })

    expect(state.loans).toEqual([LOAN])
    expect(state.reservations).toEqual([])
    expect(state.revision).toBe(1)
  })

  it('loan_returned reemplaza el préstamo por su versión devuelta', () => {
    const returned = { ...LOAN, returnedAt: '2026-10-15T12:00:00Z' }
    const state = libraryReducer(loadedState({ loans: [LOAN] }), { type: 'loan_returned', loan: returned })

    expect(state.loans).toEqual([returned])
    expect(state.revision).toBe(1)
  })

  it('reservation_added y reservation_removed actualizan la fila del usuario', () => {
    const added = libraryReducer(loadedState(), { type: 'reservation_added', reservation: RESERVATION })
    const removed = libraryReducer(added, { type: 'reservation_removed', reservationId: RESERVATION.id })

    expect(added.reservations).toEqual([RESERVATION])
    expect(removed.reservations).toEqual([])
    expect(removed.revision).toBe(2)
  })

  it('reading_saved reemplaza el estado del mismo libro y reading_removed lo quita', () => {
    const wishlist = { workId: 'OL1W', title: 'Ficciones', coverId: null, status: 'wishlist' as const }
    const reading = { ...wishlist, status: 'reading' as const }

    const saved = libraryReducer(loadedState({ readingList: [wishlist] }), { type: 'reading_saved', entry: reading })
    const removed = libraryReducer(saved, { type: 'reading_removed', workId: 'OL1W' })

    expect(saved.readingList).toEqual([reading])
    expect(removed.readingList).toEqual([])
  })
})
