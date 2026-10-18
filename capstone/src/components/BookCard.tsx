import { Link } from 'react-router'
import type { BookSummary } from '../types/book.ts'
import { getAvailabilityLabel, type BookAvailability } from '../utils/availability.ts'
import BookCover from './BookCover.tsx'
import styles from './BookCard.module.css'

interface BookCardProps {
  book: BookSummary
  // undefined = todavía no se sabe (no se muestra nada)
  availability?: BookAvailability
}

function BookCard({ book, availability }: BookCardProps) {
  return (
    <article className={styles.card}>
      <BookCover
        coverId={book.coverId}
        size="M"
        alt=""
        className={styles.cover}
        emptyClassName={styles.coverEmpty}
        loading="lazy"
      />
      <div className={styles.body}>
        <h2 className={styles.title}>
          <Link to={`/libro/${book.id}`} className={styles.link}>
            {book.title}
          </Link>
        </h2>
        <p className={`${styles.meta} ${styles.authors}`}>
          {book.authors.length > 0 ? book.authors.join(', ') : 'Autor desconocido'}
        </p>
        <div className={styles.footer}>
          {book.firstPublishYear !== null && <p className={styles.meta}>{book.firstPublishYear}</p>}
          {availability && (
            <p className={styles.availability} data-kind={availability.kind}>
              {getAvailabilityLabel(availability)}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

export default BookCard
