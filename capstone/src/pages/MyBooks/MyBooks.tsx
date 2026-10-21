import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { getLibraryErrorMessage } from '../../api/library.ts'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.tsx'
import LibraryItem from '../../components/LibraryItem/LibraryItem.tsx'
import PageTitle from '../../components/PageTitle/PageTitle.tsx'
import { useLibrary } from '../../hooks/useLibrary.ts'
import { useWishlist } from '../../hooks/useWishlist.ts'
import type { ReadingEntry } from '../../types/library.ts'
import { canBorrow, type BookAvailability } from '../../utils/availability.ts'
import { formatDate } from '../../utils/date.ts'
import styles from '../../styles/libraryPage.module.css'

const titleCollator = new Intl.Collator('en', { sensitivity: 'base' })

function byTitle(a: ReadingEntry, b: ReadingEntry) {
  return titleCollator.compare(a.title, b.title)
}

function toBookRef(entry: ReadingEntry) {
  return { id: entry.workId, title: entry.title, coverId: entry.coverId }
}

// Aviso de disponibilidad de un libro de la lista de deseos
function describeWishlistAvailability(availability: BookAvailability | null) {
  if (!availability) {
    return <p className={styles.meta}>Checking availability...</p>
  }

  if (canBorrow(availability)) {
    return <p className={styles.good}>Available! Open it to borrow it.</p>
  }

  switch (availability.kind) {
    case 'mine':
      return <p className={styles.meta}>You already have it on loan.</p>
    case 'borrowed':
      return <p className={styles.meta}>On loan until {formatDate(availability.dueAt)}</p>
    default:
      return <p className={styles.meta}>On hold for someone in line</p>
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
      setFeedback(`You removed “${entry.title}”.`)
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
        aria-label={`Remove ${entry.title} from your books`}
      >
        Remove
      </button>
    )
  }

  function renderSimpleList(entries: ReadingEntry[], emptyText: string) {
    if (entries.length === 0) {
      return <p className={styles.empty}>{emptyText}</p>
    }

    return (
      <ul className={styles.list} role="list">
        {entries.map((entry) => (
          <LibraryItem key={entry.workId} book={toBookRef(entry)} action={removeButton(entry)} />
        ))}
      </ul>
    )
  }

  return (
    <>
      <PageTitle title="My books" />
      <h1 ref={headingRef} tabIndex={-1}>
        My books
      </h1>
      <p className={styles.intro}>
        Mark each book as <em>Wishlist</em>, <em>Reading</em> or <em>Completed</em> from its page. We’ll let you
        know here and in the menu when a book from your wishlist becomes available.
      </p>

      <p role="status" className={styles.feedback}>
        {feedback}
      </p>
      {error && <ErrorMessage message={error} />}

      {library.status === 'loading' && <p className={styles.loading}>Loading your books...</p>}
      {library.status === 'error' && <ErrorMessage message="Could not load your books." onRetry={library.reload} />}

      {library.status === 'ready' && (
        <>
          <section className={styles.section} aria-labelledby="wishlist-title">
            <h2 id="wishlist-title" className={styles.sectionTitle}>
              Wishlist
              {availableCount > 0 && (
                <span className={styles.count}>
                  {`${availableCount} available`}
                </span>
              )}
            </h2>
            {sortedWishlist.length === 0 ? (
              <p className={styles.empty}>
                Your wishlist is empty. <Link to="/">Find a book</Link> and choose “Wishlist” on its page.
              </p>
            ) : (
              <ul className={styles.list} role="list">
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
              Reading
            </h2>
            {renderSimpleList(reading, 'You’re not reading any books.')}
          </section>

          <section className={styles.section} aria-labelledby="completed-title">
            <h2 id="completed-title" className={styles.sectionTitle}>
              Completed
            </h2>
            {renderSimpleList(completed, 'You haven’t marked any books as completed yet.')}
          </section>
        </>
      )}
    </>
  )
}

export default MyBooks
