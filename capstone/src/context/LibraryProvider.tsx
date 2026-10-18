import { useEffect, useReducer, useState, type ReactNode } from 'react'
import {
  borrowBook,
  cancelReservation as cancelReservationRequest,
  getMyLoans,
  getMyReadingList,
  getMyReservations,
  removeReadingStatus,
  reserveBook,
  returnBook,
  saveReadingStatus,
} from '../api/library.ts'
import { useAuth } from '../hooks/useAuth.ts'
import type { BookRef, Loan, ReadingEntry, ReadingStatus, Reservation } from '../types/library.ts'
import { LibraryContext, type LibraryStatus } from './libraryContext.ts'
import { initialLibraryState, libraryReducer } from './libraryReducer.ts'

// Listas vacías fijas: sin sesión no se muestran datos de nadie
const NO_LOANS: Loan[] = []
const NO_RESERVATIONS: Reservation[] = []
const NO_READING: ReadingEntry[] = []

interface LibraryProviderProps {
  children: ReactNode
}

function LibraryProvider({ children }: LibraryProviderProps) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [state, dispatch] = useReducer(libraryReducer, initialLibraryState)
  // Contador de reintentos: al cambiar, el efecto vuelve a cargar los datos
  const [attempt, setAttempt] = useState(0)

  const userId = user?.id ?? null
  const requestKey = userId ? `${userId}#${attempt}` : null

  // Al iniciar sesión (o cambiar de usuario) se cargan sus préstamos, reservas y lista, en paralelo
  useEffect(() => {
    if (!requestKey) {
      return
    }

    let ignore = false

    Promise.all([getMyLoans(), getMyReservations(), getMyReadingList()])
      .then(([loans, reservations, readingList]) => {
        if (!ignore) {
          dispatch({ type: 'loaded', key: requestKey, loans, reservations, readingList })
        }
      })
      .catch(() => {
        if (!ignore) {
          dispatch({ type: 'load_failed', key: requestKey })
        }
      })

    // Si el usuario cambia antes de que lleguen los datos, la respuesta vieja se ignora
    return () => {
      ignore = true
    }
  }, [requestKey])

  // El estado se deriva de la clave: datos de otra carga (otro usuario o intento) todavía no sirven
  const isCurrent = requestKey !== null && state.key === requestKey
  let status: LibraryStatus = 'ready'
  if (isAuthLoading || (userId && !isCurrent)) {
    status = 'loading'
  } else if (!userId) {
    status = 'signed-out'
  } else if (state.failed) {
    status = 'error'
  }

  async function borrow(book: BookRef) {
    const loan = await borrowBook(book)
    dispatch({ type: 'loan_added', loan })
    return loan
  }

  async function returnLoan(loanId: number) {
    const loan = await returnBook(loanId)
    dispatch({ type: 'loan_returned', loan })
  }

  async function reserve(book: BookRef) {
    const reservation = await reserveBook(book)
    dispatch({ type: 'reservation_added', reservation })
  }

  async function cancelReservation(reservationId: number) {
    await cancelReservationRequest(reservationId)
    dispatch({ type: 'reservation_removed', reservationId })
  }

  async function setReadingStatus(book: BookRef, readingStatus: ReadingStatus | null) {
    if (readingStatus === null) {
      await removeReadingStatus(book.id)
      dispatch({ type: 'reading_removed', workId: book.id })
      return
    }

    const entry = await saveReadingStatus(book, readingStatus)
    dispatch({ type: 'reading_saved', entry })
  }

  return (
    <LibraryContext
      value={{
        status,
        loans: isCurrent ? state.loans : NO_LOANS,
        reservations: isCurrent ? state.reservations : NO_RESERVATIONS,
        readingList: isCurrent ? state.readingList : NO_READING,
        revision: state.revision,
        reload: () => setAttempt((current) => current + 1),
        borrow,
        returnLoan,
        reserve,
        cancelReservation,
        setReadingStatus,
      }}
    >
      {children}
    </LibraryContext>
  )
}

export default LibraryProvider
