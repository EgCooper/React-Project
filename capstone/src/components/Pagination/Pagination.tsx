import styles from './Pagination.module.css'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav className={styles.pagination} aria-label="Paginación de resultados">
      <button
        type="button"
        className={styles.previous}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <span aria-hidden="true">←</span> Anterior
      </button>
      <span className={styles.status}>
        Página {page.toLocaleString('es')} de {totalPages.toLocaleString('es')}
      </span>
      <button
        type="button"
        className={styles.next}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Siguiente <span aria-hidden="true">→</span>
      </button>
    </nav>
  )
}

export default Pagination
