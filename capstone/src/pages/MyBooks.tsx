import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { getLibraryErrorMessage } from '../api/library.ts'
import ErrorMessage from '../components/ErrorMessage.tsx'
import LibraryItem from '../components/LibraryItem.tsx'
import itemStyles from '../components/LibraryItem.module.css'
import PageTitle from '../components/PageTitle.tsx'
import { useLibrary } from '../hooks/useLibrary.ts'
import { useWishlist } from '../hooks/useWishlist.ts'
import type { ReadingEntry } from '../types/library.ts'
import { canBorrow, type BookAvailability } from '../utils/availability.ts'
import { formatDate } from '../utils/date.ts'
import styles from './LibraryPage.module.css'

const titleCollator = new Intl.Collator('es', { sensitivity: 'base' })

function byTitle(a: ReadingEntry, b: ReadingEntry) {
  return titleCollator.compare(a.title, b.title)
}

function toBookRef(entry: ReadingEntry) {
  return { id: entry.workId, title: entry.title, coverId: entry.coverId }
}

// Aviso de disponibilidad de un libro de la lista de deseos
function describeWishlistAvailability(availability: BookAvailability | null) {
  if (!availability) {
    return <p className={itemStyles.meta}>Consultando disponibilidad...</p>
  }

  if (canBorrow(availability)) {
    return <p className={itemStyles.good}>¡Disponible! Ábrelo para pedirlo prestado.</p>
  }

  switch (availability.kind) {
    case 'mine':
      return <p className={itemStyles.meta}>Ya lo tienes prestado.</p>
    case 'borrowed':
      return <p className={itemStyles.meta}>Prestado hasta el {formatDate(availability.dueAt)}</p>
    default:
      return <p className={itemStyles.meta}>Apartado para alguien de la fila</p>
  }
}

function MyBooks() {
  const library = useLibrary()
  const { items: wishlist, availableCount } = useWishlist()
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const sortedWishlist = wishlist.toSorted((a, b) => byTitle(a.entry, b.entry))
  const reading = library.readingList.filter((entry) => entry.status === 'reading').toSorted(byTitle)
  const completed = library.readingList.filter((entry) => entry.status === 'completed').toSorted(byTitle)

  async function remove(entry: ReadingEntry) {
    if (isRunning) {
      return
    }

    setIsRunning(true)
    setError(null)
    setFeedback('')

    try {
      await library.setReadingStatus(toBookRef(entry), null)
      setFeedback(`Quitaste «${entry.title}».`)
      headingRef.current?.focus()
    } catch (caught) {
      setError(getLibraryErrorMessage(caught))
    } finally {
      setIsRunning(false)
    }
  }

  function removeButton(entry: ReadingEntry) {
    return (
      <button
        type="button"
        onClick={() => remove(entry)}
        aria-disabled={isRunning}
        aria-label={`Quitar ${entry.title} de tus libros`}
      >
        Quitar
      </button>
    )
  }

  function renderSimpleList(entries: ReadingEntry[], emptyText: string) {
    if (entries.length === 0) {
      return <p className={styles.empty}>{emptyText}</p>
    }

    return (
      <ul className={itemStyles.list} role="list">
        {entries.map((entry) => (
          <LibraryItem key={entry.workId} book={toBookRef(entry)} action={removeButton(entry)} />
        ))}
      </ul>
    )
  }

  return (
    <>
      <PageTitle title="Mis libros" />
      <h1 ref={headingRef} tabIndex={-1}>
        Mis libros
      </h1>
      <p className={styles.intro}>
        Marca cada libro como <em>Lista de deseos</em>, <em>Leyendo</em> o <em>Completado</em> desde su página. Te
        avisamos aquí y en el menú cuando un libro de tu lista de deseos esté disponible.
      </p>

      <p role="status" className={styles.feedback}>
        {feedback}
      </p>
      {error && <ErrorMessage message={error} />}

      {library.status === 'loading' && <p className={styles.loading}>Cargando tus libros...</p>}
      {library.status === 'error' && <ErrorMessage message="No se pudieron cargar tus libros." onRetry={library.reload} />}

      {library.status === 'ready' && (
        <>
          <section className={styles.section} aria-labelledby="wishlist-title">
            <h2 id="wishlist-title" className={styles.sectionTitle}>
              Lista de deseos
              {availableCount > 0 && (
                <span className={styles.count}>
                  {availableCount === 1 ? '1 disponible' : `${availableCount} disponibles`}
                </span>
              )}
            </h2>
            {sortedWishlist.length === 0 ? (
              <p className={styles.empty}>
                Tu lista está vacía. <Link to="/">Busca un libro</Link> y elige “Lista de deseos” en su página.
              </p>
            ) : (
              <ul className={itemStyles.list} role="list">
                {sortedWishlist.map(({ entry, availability }) => (
                  <LibraryItem key={entry.workId} book={toBookRef(entry)} action={removeButton(entry)}>
                    {describeWishlistAvailability(availability)}
                  </LibraryItem>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section} aria-labelledby="reading-title">
            <h2 id="reading-title" className={styles.sectionTitle}>
              Leyendo
            </h2>
            {renderSimpleList(reading, 'No estás leyendo ningún libro.')}
          </section>

          <section className={styles.section} aria-labelledby="completed-title">
            <h2 id="completed-title" className={styles.sectionTitle}>
              Completados
            </h2>
            {renderSimpleList(completed, 'Todavía no marcaste libros como completados.')}
          </section>
        </>
      )}
    </>
  )
}

export default MyBooks
