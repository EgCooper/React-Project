import './Pagination.css'

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
    <nav className="pagination" aria-label="Paginación de resultados">
      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Anterior
      </button>
      <span className="pagination__status">
        Página {page.toLocaleString('es')} de {totalPages.toLocaleString('es')}
      </span>
      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Siguiente
      </button>
    </nav>
  )
}

export default Pagination
