import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { getLibraryErrorMessage } from '../../api/library.ts'
import { LOAN_DAYS } from '../../constants/library.ts'
import { useAvailability } from '../../hooks/useAvailability.ts'
import { useLibrary } from '../../hooks/useLibrary.ts'
import buttonStyles from '../../styles/buttons.module.css'
import type { BookRef } from '../../types/library.ts'
import { canBorrow, findActiveLoan, getBookAvailability, type BookAvailability } from '../../utils/availability.ts'
import { formatDate } from '../../utils/date.ts'
import ErrorMessage from '../ErrorMessage/ErrorMessage.tsx'
import ReadingStatusField from '../ReadingStatusField/ReadingStatusField.tsx'
import styles from './BookLibraryPanel.module.css'

interface BookLibraryPanelProps {
  book: BookRef
}

interface PanelAction {
  label: string
  isPrimary: boolean
  // Hace la acción y devuelve el mensaje de éxito
  run: () => Promise<string>
}

function describeAvailability(availability: BookAvailability): string {
  switch (availability.kind) {
    case 'available':
      return 'Disponible para préstamo.'
    case 'mine':
      return availability.overdue
        ? `Tu préstamo venció el ${formatDate(availability.dueAt)}. Devuélvelo cuanto antes.`
        : `Lo tienes prestado hasta el ${formatDate(availability.dueAt)}.`
    case 'borrowed':
      return `Prestado hasta el ${formatDate(availability.dueAt)}.`
    case 'my-turn':
      return '¡Es tu turno! El libro está apartado para ti.'
    case 'on-hold':
      return 'Apartado para la siguiente persona de la fila.'
  }
}

function describeQueue(availability: BookAvailability): string | null {
  if (availability.kind !== 'borrowed' && availability.kind !== 'on-hold') {
    return null
  }

  const people = availability.queueLength === 1 ? '1 persona' : `${availability.queueLength} personas`
  const position = availability.myPosition ? ` Estás en el lugar ${availability.myPosition}.` : ''
  return availability.queueLength > 0 ? `${people} en la fila.${position}` : null
}

// Disponibilidad del libro y lo que el usuario puede hacer con él (requisitos 1, 3 y 4 del enunciado)
function BookLibraryPanel({ book }: BookLibraryPanelProps) {
  const location = useLocation()
  const library = useLibrary()
  const { byWorkId, status: availabilityStatus } = useAvailability([book.id])
  const [isRunning, setIsRunning] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState<string | null>(null)

  const myLoan = findActiveLoan(library.loans, book.id)
  const myReservation = library.reservations.find((reservation) => reservation.workId === book.id)
  const readingEntry = library.readingList.find((entry) => entry.workId === book.id)

  // Mientras no se sepa si el libro es tuyo, no se puede decidir qué botón mostrar
  const availability =
    byWorkId && library.status !== 'loading' ? getBookAvailability(byWorkId.get(book.id), myLoan) : null
  const isSignedIn = library.status === 'ready'

  function getAction(): PanelAction | null {
    if (!availability || !isSignedIn) {
      return null
    }

    if (myLoan) {
      return {
        label: 'Devolver',
        isPrimary: false,
        run: async () => {
          await library.returnLoan(myLoan.id)
          return 'Devolviste el libro. ¡Gracias!'
        },
      }
    }

    if (canBorrow(availability)) {
      return {
        label: 'Pedir prestado',
        isPrimary: true,
        run: async () => {
          const loan = await library.borrow(book)
          return `¡Listo! Devuélvelo antes del ${formatDate(loan.dueAt)}.`
        },
      }
    }

    if (myReservation) {
      return {
        label: 'Cancelar reserva',
        isPrimary: false,
        run: async () => {
          await library.cancelReservation(myReservation.id)
          return 'Cancelaste tu reserva.'
        },
      }
    }

    return {
      label: 'Reservar',
      isPrimary: true,
      run: async () => {
        await library.reserve(book)
        return 'Te uniste a la fila. Cuando sea tu turno lo verás aquí y en "Mis préstamos".'
      },
    }
  }

  const action = getAction()

  async function handleAction(panelAction: PanelAction) {
    // aria-disabled en lugar de disabled: el botón conserva el foco, así que se ignoran los clics repetidos aquí
    if (isRunning) {
      return
    }

    setIsRunning(true)
    setError(null)
    setFeedback('')

    try {
      setFeedback(await panelAction.run())
    } catch (caught) {
      setError(getLibraryErrorMessage(caught))
    } finally {
      setIsRunning(false)
    }
  }

  const queueText = availability ? describeQueue(availability) : null

  return (
    <section className={styles.panel} aria-labelledby="library-panel-title">
      <h2 id="library-panel-title" className={styles.heading}>
        Disponibilidad
      </h2>

      {availability ? (
        <>
          <p className={styles.status} data-kind={availability.kind}>
            {describeAvailability(availability)}
          </p>
          {queueText && <p className={styles.hint}>{queueText}</p>}
        </>
      ) : (
        <p className={styles.hint}>
          {availabilityStatus === 'error' ? 'No se pudo consultar la disponibilidad.' : 'Consultando disponibilidad...'}
        </p>
      )}

      {library.status === 'error' && (
        <ErrorMessage message="No se pudieron cargar tus préstamos." onRetry={library.reload} />
      )}

      {library.status === 'signed-out' && (
        <p className={styles.hint}>
          <Link to="/iniciar-sesion" state={{ from: location.pathname }}>
            Inicia sesión
          </Link>{' '}
          para pedirlo prestado, reservarlo o guardarlo en tu lista.
        </p>
      )}

      {action && (
        <div className={styles.actions}>
          {/* Siempre el mismo <button>: al cambiar de "Pedir prestado" a "Devolver" no se pierde el foco */}
          <button
            type="button"
            className={action.isPrimary ? buttonStyles.primary : undefined}
            onClick={() => handleAction(action)}
            aria-disabled={isRunning}
          >
            {isRunning ? 'Procesando...' : action.label}
          </button>
          {action.label === 'Pedir prestado' && <span className={styles.hint}>Plazo: {LOAN_DAYS} días.</span>}
        </div>
      )}

      {/* Siempre presente para que el lector de pantalla anuncie cada mensaje nuevo */}
      <p role="status" className={styles.feedback}>
        {feedback}
      </p>
      {error && <ErrorMessage message={error} />}

      {isSignedIn && <ReadingStatusField book={book} entry={readingEntry} />}
    </section>
  )
}

export default BookLibraryPanel
