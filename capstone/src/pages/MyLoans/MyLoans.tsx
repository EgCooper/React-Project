import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { getLibraryErrorMessage } from '../../api/library.ts'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.tsx'
import LibraryItem from '../../components/LibraryItem/LibraryItem.tsx'
import PageTitle from '../../components/PageTitle/PageTitle.tsx'
import { MAX_ACTIVE_LOANS } from '../../constants/library.ts'
import { useAvailability, type UseAvailabilityResult } from '../../hooks/useAvailability.ts'
import { useLibrary } from '../../hooks/useLibrary.ts'
import type { Loan, Reservation } from '../../types/library.ts'
import { getBookAvailability } from '../../utils/availability.ts'
import { formatDate, isOverdue } from '../../utils/date.ts'
import styles from '../../styles/libraryPage.module.css'

function toBookRef(item: Loan | Reservation) {
  return { id: item.workId, title: item.title, coverId: item.coverId }
}

// Lugar en la fila de una reserva, a partir de la disponibilidad del libro
function describeReservation(reservation: Reservation, byWorkId: UseAvailabilityResult['byWorkId']) {
  if (!byWorkId) {
    return <p className={styles.meta}>En la fila</p>
  }

  const availability = getBookAvailability(byWorkId.get(reservation.workId), undefined)

  if (availability.kind === 'my-turn') {
    return <p className={styles.good}>¡Es tu turno! Abre el libro para pedirlo prestado.</p>
  }

  if ((availability.kind === 'borrowed' || availability.kind === 'on-hold') && availability.myPosition) {
    return (
      <p className={styles.meta}>
        Lugar {availability.myPosition} de {availability.queueLength} en la fila
      </p>
    )
  }

  return <p className={styles.meta}>En la fila</p>
}

function MyLoans() {
  const library = useLibrary()
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const activeLoans = library.loans.filter((loan) => loan.returnedAt === null)
  const pastLoans = library.loans.filter((loan) => loan.returnedAt !== null)
  const { byWorkId } = useAvailability(library.reservations.map((reservation) => reservation.workId))

  async function runAction(action: () => Promise<void>, successMessage: string) {
    // aria-disabled en lugar de disabled: se ignoran los clics mientras hay una acción en curso
    if (isRunning) {
      return
    }

    setIsRunning(true)
    setError(null)
    setFeedback('')

    try {
      await action()
      setFeedback(successMessage)
      // El botón pulsado desaparece de la lista: el foco vuelve al título para no perderse
      headingRef.current?.focus()
    } catch (caught) {
      setError(getLibraryErrorMessage(caught))
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <>
      <PageTitle title="Mis préstamos" />
      <h1 ref={headingRef} tabIndex={-1}>
        Mis préstamos
      </h1>

      {/* Siempre presente para que el lector de pantalla anuncie cada mensaje nuevo */}
      <p role="status" className={styles.feedback}>
        {feedback}
      </p>
      {error && <ErrorMessage message={error} />}

      {library.status === 'loading' && <p className={styles.loading}>Cargando tus préstamos...</p>}
      {library.status === 'error' && (
        <ErrorMessage message="No se pudieron cargar tus préstamos." onRetry={library.reload} />
      )}

      {library.status === 'ready' && (
        <>
          <section className={styles.section} aria-labelledby="active-loans-title">
            <h2 id="active-loans-title" className={styles.sectionTitle}>
              Préstamos activos
              <span className={styles.count}>
                {activeLoans.length} de {MAX_ACTIVE_LOANS}
              </span>
            </h2>
            {activeLoans.length === 0 ? (
              <p className={styles.empty}>
                No tienes libros prestados. <Link to="/">Explora el catálogo</Link>.
              </p>
            ) : (
              <ul className={styles.list} role="list">
                {activeLoans.map((loan) => (
                  <LibraryItem
                    key={loan.id}
                    book={toBookRef(loan)}
                    action={
                      <button
                        type="button"
                        onClick={() => runAction(() => library.returnLoan(loan.id), `Devolviste «${loan.title}».`)}
                        aria-disabled={isRunning}
                        aria-label={`Devolver ${loan.title}`}
                      >
                        Devolver
                      </button>
                    }
                  >
                    {isOverdue(loan.dueAt) ? (
                      <p className={styles.alert}>Venció el {formatDate(loan.dueAt)}. Devuélvelo cuanto antes.</p>
                    ) : (
                      <p className={styles.meta}>Devuélvelo antes del {formatDate(loan.dueAt)}</p>
                    )}
                  </LibraryItem>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section} aria-labelledby="reservations-title">
            <h2 id="reservations-title" className={styles.sectionTitle}>
              Reservas
            </h2>
            {library.reservations.length === 0 ? (
              <p className={styles.empty}>No tienes reservas. Si un libro está prestado, puedes reservarlo desde su página.</p>
            ) : (
              <ul className={styles.list} role="list">
                {library.reservations.map((reservation) => (
                  <LibraryItem
                    key={reservation.id}
                    book={toBookRef(reservation)}
                    action={
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            () => library.cancelReservation(reservation.id),
                            `Cancelaste tu reserva de «${reservation.title}».`,
                          )
                        }
                        aria-disabled={isRunning}
                        aria-label={`Cancelar reserva de ${reservation.title}`}
                      >
                        Cancelar reserva
                      </button>
                    }
                  >
                    {describeReservation(reservation, byWorkId)}
                  </LibraryItem>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section} aria-labelledby="history-title">
            <h2 id="history-title" className={styles.sectionTitle}>
              Historial
            </h2>
            {pastLoans.length === 0 ? (
              <p className={styles.empty}>Aquí aparecerán los libros que devuelvas.</p>
            ) : (
              <ul className={styles.list} role="list">
                {pastLoans.map((loan) => (
                  <LibraryItem key={loan.id} book={toBookRef(loan)}>
                    <p className={styles.meta}>
                      Del {formatDate(loan.borrowedAt)} al {formatDate(loan.returnedAt ?? loan.dueAt)}
                    </p>
                  </LibraryItem>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  )
}

export default MyLoans
