import { Link } from 'react-router'
import { getCoverUrl } from '../api/openLibrary.ts'
import type { BookSummary } from '../types/book.ts'
import styles from './BookCard.module.css'

interface BookCardProps {
  book: BookSummary
}

function BookCard({ book }: BookCardProps) {
  return (
    <article className={styles.card}>
      {book.coverId !== null ? (
        <img
          className={styles.cover}
          src={getCoverUrl(book.coverId)}
          alt=""
          loading="lazy"
        />
      ) : (
        <div className={`${styles.cover} ${styles.coverEmpty}`} aria-hidden="true">
          Sin portada
        </div>
      )}
      <div className={styles.body}>
        <h2 className={styles.title}>
          <Link to={`/libro/${book.id}`} className={styles.link}>
            {book.title}
          </Link>
        </h2>
        <p className={`${styles.meta} ${styles.authors}`}>
          {book.authors.length > 0 ? book.authors.join(', ') : 'Autor desconocido'}
        </p>
        {book.firstPublishYear !== null && (
          <p className={`${styles.meta} ${styles.year}`}>{book.firstPublishYear}</p>
        )}
      </div>
    </article>
  )
}

export default BookCard
