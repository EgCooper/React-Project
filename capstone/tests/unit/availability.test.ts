import { describe, expect, it } from 'vitest'
import type { Availability, Loan } from '../../src/types/library.ts'
import { canBorrow, findActiveLoan, getAvailabilityLabel, getBookAvailability } from '../../src/utils/availability.ts'

const NOW = new Date('2026-10-20T12:00:00Z')

const MY_LOAN: Loan = {
  id: 1,
  workId: 'OL1W',
  title: 'Ficciones',
  coverId: null,
  borrowedAt: '2026-10-10T12:00:00Z',
  dueAt: '2026-10-24T12:00:00Z',
  returnedAt: null,
}

function availabilityRow(changes: Partial<Availability>): Availability {
  return { workId: 'OL1W', dueAt: null, queueLength: 0, myQueuePosition: null, ...changes }
}

describe('getBookAvailability', () => {
  it('si el libro no aparece en get_availability, está disponible', () => {
    expect(getBookAvailability(undefined, undefined, NOW)).toEqual({ kind: 'available' })
  })

  it('si el usuario lo tiene, indica su vencimiento y si ya venció', () => {
    expect(getBookAvailability(undefined, MY_LOAN, NOW)).toEqual({
      kind: 'mine',
      dueAt: '2026-10-24T12:00:00Z',
      overdue: false,
    })
    expect(getBookAvailability(undefined, { ...MY_LOAN, dueAt: '2026-10-19T12:00:00Z' }, NOW)).toMatchObject({
      kind: 'mine',
      overdue: true,
    })
  })

  it('prestado a otra persona, con la fila y el lugar del usuario', () => {
    const row = availabilityRow({ dueAt: '2026-10-25T12:00:00Z', queueLength: 2, myQueuePosition: 2 })
    expect(getBookAvailability(row, undefined, NOW)).toEqual({
      kind: 'borrowed',
      dueAt: '2026-10-25T12:00:00Z',
      queueLength: 2,
      myPosition: 2,
    })
  })

  it('devuelto con fila: es tu turno si eres el primero; si no, está apartado', () => {
    expect(getBookAvailability(availabilityRow({ queueLength: 2, myQueuePosition: 1 }), undefined, NOW)).toEqual({
      kind: 'my-turn',
    })
    expect(getBookAvailability(availabilityRow({ queueLength: 2, myQueuePosition: 2 }), undefined, NOW)).toEqual({
      kind: 'on-hold',
      queueLength: 2,
      myPosition: 2,
    })
  })
})

describe('canBorrow y getAvailabilityLabel', () => {
  it('solo se puede pedir si está disponible o es tu turno', () => {
    expect(canBorrow({ kind: 'available' })).toBe(true)
    expect(canBorrow({ kind: 'my-turn' })).toBe(true)
    expect(canBorrow({ kind: 'on-hold', queueLength: 1, myPosition: null })).toBe(false)
    expect(canBorrow({ kind: 'mine', dueAt: '', overdue: false })).toBe(false)
  })

  it('etiquetas cortas para las tarjetas', () => {
    expect(getAvailabilityLabel({ kind: 'available' })).toBe('Available')
    expect(getAvailabilityLabel({ kind: 'borrowed', dueAt: '', queueLength: 0, myPosition: null })).toBe('On loan')
    expect(getAvailabilityLabel({ kind: 'mine', dueAt: '', overdue: true })).toBe('Overdue')
  })
})

describe('findActiveLoan', () => {
  it('ignora los préstamos ya devueltos', () => {
    const returned = { ...MY_LOAN, id: 2, returnedAt: '2026-10-12T12:00:00Z' }
    expect(findActiveLoan([returned], 'OL1W')).toBeUndefined()
    expect(findActiveLoan([returned, MY_LOAN], 'OL1W')).toBe(MY_LOAN)
  })
})
