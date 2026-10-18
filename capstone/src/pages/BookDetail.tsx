import { Link, useLocation, useNavigate, useParams } from 'react-router'
import BookCover from '../components/BookCover.tsx'
import BookLibraryPanel from '../components/BookLibraryPanel.tsx'
import ErrorMessage from '../components/ErrorMessage.tsx'
import PageTitle from '../components/PageTitle.tsx'
import { useBookDetail } from '../hooks/useBookDetail.ts'
import skeletonStyles from '../styles/skeleton.module.css'
import styles from './BookDetail.module.css'

function BookDetail() {
  const { id } = useParams()
  const { state, retry } = useBookDetail(id ?? '')
  const navigate = useNavigate()
  const location = useLocation()

  // 'default' = se abrio esta URL directamente (no hay pagina anterior dentro de la app)
  const canGoBack = location.key !== 'default'

  const pageTitle =
    state.status === 'success'
      ? state.book.title
      : state.status === 'not-found'
        ? 'Libro no encontrado'
        : 'Detalle del libro'

  return (
    <>
      <PageTitle title={pageTitle} />
      {canGoBack ? (
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          <span aria-hidden="true">←</span> Volver
        </button>
      ) : (
        <Link to="/" className={styles.back}>
          <span aria-hidden="true">←</span> Ir al catálogo
        </Link>
      )}

      {state.status === 'loading' && (
        <>
          <p role="status" className={styles.loadingText}>
            Cargando libro...
          </p>
          {/* Relleno con la misma distribución que el detalle: portada, título, autor y descripción */}
          <div className={styles.detail} aria-hidden="true">
            <div className={`${skeletonStyles.block} ${styles.cover}`} />
            <div className={styles.info}>
              <div className={`${skeletonStyles.block} ${styles.skeletonTitle}`} />
              <div className={`${skeletonStyles.block} ${styles.skeletonAuthor}`} />
              <div className={styles.skeletonText}>
                <div className={skeletonStyles.block} />
                <div className={skeletonStyles.block} />
                <div className={skeletonStyles.block} />
                <div className={skeletonStyles.block} />
              </div>
            </div>
          </div>
        </>
      )}

      {state.status === 'error' && <ErrorMessage message="No se pudo cargar el libro." onRetry={retry} />}

      {state.status === 'not-found' && (
        <>
          <h1>Libro no encontrado</h1>
          <p>El libro que buscas no existe o fue eliminado del catálogo.</p>
        </>
      )}

      {state.status === 'success' && (
        <article className={styles.detail}>
          <BookCover
            coverId={state.book.coverId}
            size="L"
            alt={`Portada de ${state.book.title}`}
            className={styles.cover}
            emptyClassName={styles.coverEmpty}
          />

          <div className={styles.info}>
            <h1 className={styles.title}>{state.book.title}</h1>
            <p className={styles.authors}>
              {state.book.authors.length > 0 ? state.book.authors.join(', ') : 'Autor desconocido'}
            </p>

            <BookLibraryPanel
              book={{ id: state.book.id, title: state.book.title, coverId: state.book.coverId }}
            />

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
