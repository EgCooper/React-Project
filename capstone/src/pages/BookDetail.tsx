import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { getCoverUrl } from '../api/openLibrary.ts'
import { useBookDetail } from '../hooks/useBookDetail.ts'
import buttonStyles from '../styles/buttons.module.css'
import styles from './BookDetail.module.css'

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
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          <span aria-hidden="true">←</span> Volver
        </button>
      ) : (
        <Link to="/" className={styles.back}>
          <span aria-hidden="true">←</span> Ir al catálogo
        </Link>
      )}

      {state.status === 'loading' && <p role="status">Cargando libro...</p>}

      {state.status === 'error' && (
        <div>
          <p role="alert">No se pudo cargar el libro.</p>
          <button type="button" className={buttonStyles.primary} onClick={retry}>
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
        <article className={styles.detail}>
          {state.book.coverId !== null ? (
            <img
              className={styles.cover}
              src={getCoverUrl(state.book.coverId, 'L')}
              alt={`Portada de ${state.book.title}`}
            />
          ) : (
            <div className={`${styles.cover} ${styles.coverEmpty}`} aria-hidden="true">
              Sin portada
            </div>
          )}

          <div className={styles.info}>
            <h1 className={styles.title}>{state.book.title}</h1>
            <p className={styles.authors}>
              {state.book.authors.length > 0 ? state.book.authors.join(', ') : 'Autor desconocido'}
            </p>

            {state.book.subjects.length > 0 && (
              <ul className={styles.subjects} role="list" aria-label="Géneros">
                {state.book.subjects.map((subject) => (
                  <li key={subject}>{subject}</li>
                ))}
              </ul>
            )}

            <h2 className={styles.sectionTitle}>Descripción</h2>
            <p className={styles.description}>
              {state.book.description ?? 'Este libro no tiene descripción.'}
            </p>
          </div>
        </article>
      )}
    </>
  )
}

export default BookDetail
