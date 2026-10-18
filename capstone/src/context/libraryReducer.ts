import type { Loan, ReadingEntry, Reservation } from '../types/library.ts'

export interface LibraryState {
  // A qué carga pertenecen los datos (usuario + intento): si no coincide con la actual, están desactualizados
  key: string | null
  failed: boolean
  loans: Loan[]
  reservations: Reservation[]
  readingList: ReadingEntry[]
  // Sube con cada préstamo, devolución o reserva: avisa que la disponibilidad cambió
  revision: number
}

export type LibraryAction =
  | { type: 'loaded'; key: string; loans: Loan[]; reservations: Reservation[]; readingList: ReadingEntry[] }
  | { type: 'load_failed'; key: string }
  | { type: 'loan_added'; loan: Loan }
  | { type: 'loan_returned'; loan: Loan }
  | { type: 'reservation_added'; reservation: Reservation }
  | { type: 'reservation_removed'; reservationId: number }
  | { type: 'reading_saved'; entry: ReadingEntry }
  | { type: 'reading_removed'; workId: string }

export const initialLibraryState: LibraryState = {
  key: null,
  failed: false,
  loans: [],
  reservations: [],
  readingList: [],
  revision: 0,
}

export function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    case 'loaded':
      return {
        ...state,
        key: action.key,
        failed: false,
        loans: action.loans,
        reservations: action.reservations,
        readingList: action.readingList,
      }
    case 'load_failed':
      return { ...state, key: action.key, failed: true, loans: [], reservations: [], readingList: [] }
    case 'loan_added':
      return {
        ...state,
        // El más reciente primero, igual que getMyLoans
        loans: [action.loan, ...state.loans],
        // Si el usuario estaba en la fila de ese libro, borrow_book cumplió su reserva
        reservations: state.reservations.filter((reservation) => reservation.workId !== action.loan.workId),
        revision: state.revision + 1,
      }
    case 'loan_returned':
      return {
        ...state,
        loans: state.loans.map((loan) => (loan.id === action.loan.id ? action.loan : loan)),
        revision: state.revision + 1,
      }
    case 'reservation_added':
      return { ...state, reservations: [...state.reservations, action.reservation], revision: state.revision + 1 }
    case 'reservation_removed':
      return {
        ...state,
        reservations: state.reservations.filter((reservation) => reservation.id !== action.reservationId),
        revision: state.revision + 1,
      }
    case 'reading_saved':
      return {
        ...state,
        readingList: [...state.readingList.filter((entry) => entry.workId !== action.entry.workId), action.entry],
      }
    case 'reading_removed':
      return { ...state, readingList: state.readingList.filter((entry) => entry.workId !== action.workId) }
  }
}
