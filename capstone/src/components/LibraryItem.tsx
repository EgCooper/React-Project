import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { BookRef } from '../types/library.ts'
import BookCover from './BookCover.tsx'
import styles from './LibraryItem.module.css'

interface LibraryItemProps {
  book: BookRef
  // Datos extra debajo del título (vencimiento, lugar en la fila...)
  children?: ReactNode
  action?: ReactNode
}

// Fila de "Mis préstamos" y "Mis libros": portada chica, título con enlace, datos y una acción
function LibraryItem({ book, children, action }: LibraryItemProps) {
  return (
    <li className={styles.item}>
      <BookCover
        coverId={book.coverId}
        size="S"
        alt=""
        className={styles.cover}
        emptyClassName={styles.coverEmpty}
        loading="lazy"
      />
      <div className={styles.info}>
        <Link to={`/libro/${book.id}`} className={styles.title}>
          {book.title}
        </Link>
        {children}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </li>
  )
}

export default LibraryItem
