import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { getCoverUrl } from '../api/openLibrary.ts'
import { useBookDetail } from '../hooks/useBookDetail.ts'
import './BookDetail.css'

function BookDetail() {
  const { id } = useParams()
  const { state, retry } = useBookDetail(id ?? '')
  const navigate = useNavigate()
  const location = useLocation()

  // 'default' = se abrio esta URL directamente (no hay pagina anterior dentro de la app)
  const canGoBack = location.key !== 'default'

  return (
    <>
      {canGoBack ? (
        <button type="button" className="book-detail__back" onClick={() => navigate(-1)}>
          <span aria-hidden="true">←</span> Volver
        </button>
      ) : (
        <Link to="/" className="book-detail__back">
          <span aria-hidden="true">←</span> Ir al catálogo
        </Link>
      )}

      {state.status === 'loading' && <p role="status">Cargando libro...</p>}

      {state.status === 'error' && (
        <div>
          <p role="alert">No se pudo cargar el libro.</p>
          <button type="button" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}

      {state.status === 'not-found' && (
        <>
          <h1>Libro no encontrado</h1>
          <p>El libro que buscas no existe o fue eliminado del catálogo.</p>
        </>
      )}

      {state.status === 'success' && (
        <article className="book-detail">
          {state.book.coverId !== null ? (
            <img
              className="book-detail__cover"
              src={getCoverUrl(state.book.coverId, 'L')}
              alt={`Portada de ${state.book.title}`}
            />
          ) : (
            <div className="book-detail__cover book-detail__cover--empty" aria-hidden="true">
              Sin portada
            </div>
          )}

          <div>
            <h1>{state.book.title}</h1>
            <p className="book-detail__authors">
              {state.book.authors.length > 0 ? state.book.authors.join(', ') : 'Autor desconocido'}
            </p>

            {state.book.subjects.length > 0 && (
              <ul className="book-detail__subjects" role="list" aria-label="Géneros">
                {state.book.subjects.map((subject) => (
                  <li key={subject}>{subject}</li>
                ))}
              </ul>
            )}

            <h2>Descripción</h2>
            <p className="book-detail__description">
              {state.book.description ?? 'Este libro no tiene descripción.'}
            </p>
          </div>
        </article>
      )}
    </>
  )
}

export default BookDetail
