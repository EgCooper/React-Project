import { Link, useLocation, useNavigate, useParams } from 'react-router'
import BookCover from '../../components/BookCover/BookCover.tsx'
import BookLibraryPanel from '../../components/BookLibraryPanel/BookLibraryPanel.tsx'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.tsx'
import PageTitle from '../../components/PageTitle/PageTitle.tsx'
import { useBookDetail } from '../../hooks/useBookDetail.ts'
import skeletonStyles from '../../styles/skeleton.module.css'
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
        ? 'Book not found'
        : 'Book details'

  return (
    <>
      <PageTitle title={pageTitle} />
      {canGoBack ? (
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          <span aria-hidden="true">←</span> Back
        </button>
      ) : (
        <Link to="/" className={styles.back}>
          <span aria-hidden="true">←</span> Go to catalog
        </Link>
      )}

      {state.status === 'loading' && (
        <>
          <p role="status" className={styles.loadingText}>
            Loading book...
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

      {state.status === 'error' && <ErrorMessage message="Could not load the book." onRetry={retry} />}

      {state.status === 'not-found' && (
        <>
          <h1>Book not found</h1>
          <p>The book you’re looking for doesn’t exist or was removed from the catalog.</p>
        </>
      )}

      {state.status === 'success' && (
        <article className={styles.detail}>
          <BookCover
            coverId={state.book.coverId}
            size="L"
            alt={`Cover of ${state.book.title}`}
            className={styles.cover}
            emptyClassName={styles.coverEmpty}
          />

          <div className={styles.info}>
            <h1 className={styles.title}>{state.book.title}</h1>
            <p className={styles.authors}>
              {state.book.authors.length > 0 ? state.book.authors.join(', ') : 'Unknown author'}
            </p>

            <BookLibraryPanel
              book={{ id: state.book.id, title: state.book.title, coverId: state.book.coverId }}
            />

            {state.book.subjects.length > 0 && (
              <ul className={styles.subjects} role="list" aria-label="Subjects">
                {state.book.subjects.map((subject) => (
                  <li key={subject}>{subject}</li>
                ))}
              </ul>
            )}

            <h2 className={styles.sectionTitle}>Description</h2>
            <p className={styles.description}>
              {state.book.description ?? 'This book has no description.'}
            </p>
          </div>
        </article>
      )}
    </>
  )
}

export default BookDetail
