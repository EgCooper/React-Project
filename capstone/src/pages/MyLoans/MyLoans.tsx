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
    return <p className={styles.meta}>In line</p>
  }

  const availability = getBookAvailability(byWorkId.get(reservation.workId), undefined)

  if (availability.kind === 'my-turn') {
    return <p className={styles.good}>It’s your turn! Open the book to borrow it.</p>
  }

  if ((availability.kind === 'borrowed' || availability.kind === 'on-hold') && availability.myPosition) {
    return (
      <p className={styles.meta}>
        Number {availability.myPosition} of {availability.queueLength} in line
      </p>
    )
  }

  return <p className={styles.meta}>In line</p>
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
      <PageTitle title="My loans" />
      <h1 ref={headingRef} tabIndex={-1}>
        My loans
      </h1>

      {/* Siempre presente para que el lector de pantalla anuncie cada mensaje nuevo */}
      <p role="status" className={styles.feedback}>
        {feedback}
      </p>
      {error && <ErrorMessage message={error} />}

      {library.status === 'loading' && <p className={styles.loading}>Loading your loans...</p>}
      {library.status === 'error' && (
        <ErrorMessage message="Could not load your loans." onRetry={library.reload} />
      )}

      {library.status === 'ready' && (
        <>
          <section className={styles.section} aria-labelledby="active-loans-title">
            <h2 id="active-loans-title" className={styles.sectionTitle}>
              Active loans
              <span className={styles.count}>
                {activeLoans.length} of {MAX_ACTIVE_LOANS}
              </span>
            </h2>
            {activeLoans.length === 0 ? (
              <p className={styles.empty}>
                You have no books on loan. <Link to="/">Browse the catalog</Link>.
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
                        onClick={() => runAction(() => library.returnLoan(loan.id), `You returned “${loan.title}”.`)}
                        aria-disabled={isRunning}
                        aria-label={`Return ${loan.title}`}
                      >
                        Return
                      </button>
                    }
                  >
                    {isOverdue(loan.dueAt) ? (
                      <p className={styles.alert}>Was due on {formatDate(loan.dueAt)}. Please return it as soon as possible.</p>
                    ) : (
                      <p className={styles.meta}>Return by {formatDate(loan.dueAt)}</p>
                    )}
                  </LibraryItem>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section} aria-labelledby="reservations-title">
            <h2 id="reservations-title" className={styles.sectionTitle}>
              Reservations
            </h2>
            {library.reservations.length === 0 ? (
              <p className={styles.empty}>You have no reservations. If a book is on loan, you can reserve it from its page.</p>
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
                            `You canceled your reservation for “${reservation.title}”.`,
                          )
                        }
                        aria-disabled={isRunning}
                        aria-label={`Cancel reservation for ${reservation.title}`}
                      >
                        Cancel reservation
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
              History
            </h2>
            {pastLoans.length === 0 ? (
              <p className={styles.empty}>Books you return will appear here.</p>
            ) : (
              <ul className={styles.list} role="list">
                {pastLoans.map((loan) => (
                  <LibraryItem key={loan.id} book={toBookRef(loan)}>
                    <p className={styles.meta}>
                      From {formatDate(loan.borrowedAt)} to {formatDate(loan.returnedAt ?? loan.dueAt)}
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
