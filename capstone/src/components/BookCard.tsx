import { Link } from 'react-router'
import { getCoverUrl } from '../api/openLibrary.ts'
import type { BookSummary } from '../types/book.ts'
import './BookCard.css'

interface BookCardProps {
  book: BookSummary
}

function BookCard({ book }: BookCardProps) {
  return (
    <article className="book-card">
      {book.coverId !== null ? (
        <img
          className="book-card__cover"
          src={getCoverUrl(book.coverId)}
          alt=""
          loading="lazy"
        />
      ) : (
        <div className="book-card__cover book-card__cover--empty" aria-hidden="true">
          Sin portada
        </div>
      )}
      <h2 className="book-card__title">
        <Link to={`/libro/${book.id}`}>{book.title}</Link>
      </h2>
      <p className="book-card__meta">
        {book.authors.length > 0 ? book.authors.join(', ') : 'Autor desconocido'}
      </p>
      {book.firstPublishYear !== null && (
        <p className="book-card__meta">{book.firstPublishYear}</p>
      )}
    </article>
  )
}

export default BookCard
