import type { Availability, Loan } from '../types/library.ts'
import { isOverdue } from './date.ts'

// Situación de un libro para el usuario actual
export type BookAvailability =
  // Nadie lo tiene y no hay fila
  | { kind: 'available' }
  // Lo tiene el usuario actual
  | { kind: 'mine'; dueAt: string; overdue: boolean }
  // Lo tiene otra persona
  | { kind: 'borrowed'; dueAt: string; queueLength: number; myPosition: number | null }
  // Se devolvió y el usuario actual es el primero de la fila
  | { kind: 'my-turn' }
  // Se devolvió, pero está apartado para alguien de la fila
  | { kind: 'on-hold'; queueLength: number; myPosition: number | null }

// availability: fila de get_availability (undefined = el libro no apareció, está libre)
// myActiveLoan: préstamo sin devolver del usuario actual para ese libro, si lo tiene
export function getBookAvailability(
  availability: Availability | undefined,
  myActiveLoan: Loan | undefined,
  now: Date = new Date(),
): BookAvailability {
  if (myActiveLoan) {
    return { kind: 'mine', dueAt: myActiveLoan.dueAt, overdue: isOverdue(myActiveLoan.dueAt, now) }
  }

  if (!availability) {
    return { kind: 'available' }
  }

  if (availability.dueAt) {
    return {
      kind: 'borrowed',
      dueAt: availability.dueAt,
      queueLength: availability.queueLength,
      myPosition: availability.myQueuePosition,
    }
  }

  if (availability.myQueuePosition === 1) {
    return { kind: 'my-turn' }
  }

  return { kind: 'on-hold', queueLength: availability.queueLength, myPosition: availability.myQueuePosition }
}

// Préstamo sin devolver del usuario para ese libro (undefined si no lo tiene)
export function findActiveLoan(loans: Loan[], workId: string): Loan | undefined {
  return loans.find((loan) => loan.workId === workId && loan.returnedAt === null)
}

// Se puede pedir prestado ahora mismo
export function canBorrow(availability: BookAvailability): boolean {
  return availability.kind === 'available' || availability.kind === 'my-turn'
}

// Etiqueta corta para las tarjetas y las listas
export function getAvailabilityLabel(availability: BookAvailability): string {
  switch (availability.kind) {
    case 'available':
      return 'Available'
    case 'mine':
      return availability.overdue ? 'Overdue' : 'You have it'
    case 'borrowed':
      return 'On loan'
    case 'my-turn':
      return 'Your turn'
    case 'on-hold':
      return 'On hold'
  }
}
