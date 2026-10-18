import { createContext } from 'react'
import type { BookRef, Loan, ReadingEntry, ReadingStatus, Reservation } from '../types/library.ts'

// signed-out: sin sesión · loading: cargando los datos del usuario · ready: listos · error: falló la carga
export type LibraryStatus = 'signed-out' | 'loading' | 'ready' | 'error'

export interface LibraryContextValue {
  status: LibraryStatus
  // Todos los préstamos del usuario (activos e historial), el más reciente primero
  loans: Loan[]
  // Reservas en espera
  reservations: Reservation[]
  // Estado de lectura de cada libro (incluye la lista de deseos)
  readingList: ReadingEntry[]
  // Sube con cada préstamo, devolución o reserva; useAvailability lo usa para volver a consultar
  revision: number
  reload: () => void
  borrow: (book: BookRef) => Promise<Loan>
  returnLoan: (loanId: number) => Promise<void>
  reserve: (book: BookRef) => Promise<void>
  cancelReservation: (reservationId: number) => Promise<void>
  // null = quitar el estado de lectura
  setReadingStatus: (book: BookRef, status: ReadingStatus | null) => Promise<void>
}

export const LibraryContext = createContext<LibraryContextValue | null>(null)
