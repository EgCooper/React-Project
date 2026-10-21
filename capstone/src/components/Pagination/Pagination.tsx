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
    <nav className={styles.pagination} aria-label="Results pagination">
      <button
        type="button"
        className={styles.previous}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <span aria-hidden="true">←</span> Previous
      </button>
      <span className={styles.status}>
        Page {page.toLocaleString('en')} of {totalPages.toLocaleString('en')}
      </span>
      <button
        type="button"
        className={styles.next}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next <span aria-hidden="true">→</span>
      </button>
    </nav>
  )
}

export default Pagination
