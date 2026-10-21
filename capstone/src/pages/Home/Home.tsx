import { useSearchParams } from 'react-router'
import BookCard from '../../components/BookCard/BookCard.tsx'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.tsx'
import PageTitle from '../../components/PageTitle/PageTitle.tsx'
import SearchBar from '../../components/SearchBar/SearchBar.tsx'
import { useBooks } from '../../hooks/useBooks.ts'
import { useAvailability } from '../../hooks/useAvailability.ts'
import { useDebounce } from '../../hooks/useDebounce.ts'
import { useLibrary } from '../../hooks/useLibrary.ts'
import FilterBar from '../../components/FilterBar/FilterBar.tsx'
import Pagination from '../../components/Pagination/Pagination.tsx'
import { CATEGORIES, SORT_OPTIONS } from '../../constants/catalog.ts'
import { AUTHOR_SORT_LIMIT, PAGE_SIZE } from '../../api/openLibrary.ts'
import skeletonStyles from '../../styles/skeleton.module.css'
import { findActiveLoan, getBookAvailability } from '../../utils/availability.ts'
import { parsePage } from '../../utils/url.ts'
import styles from './Home.module.css'

const DEFAULT_QUERY = 'language:spa'
const SEARCH_DELAY_MS = 400
const HAS_LETTER_OR_NUMBER = /[\p{L}\p{N}]/u

function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchText = searchParams.get('q') ?? ''
  const debouncedText = useDebounce(searchText.trim(), SEARCH_DELAY_MS)
  const isSearching = HAS_LETTER_OR_NUMBER.test(debouncedText)
  const query = isSearching ? debouncedText : DEFAULT_QUERY

  // La URL la puede editar cualquiera: solo aceptamos valores que existan en las listas
  const category = CATEGORIES.find((option) => option.value === searchParams.get('category'))?.value ?? null
  const sort = SORT_OPTIONS.find((option) => option.value === searchParams.get('sort'))?.value ?? 'relevance'
  const page = parsePage(searchParams.get('page'))

  const { books, total, isLoading, error, retry } = useBooks({ query, page, subject: category, sort })
  // Al ordenar por autor solo se pueden recorrer los primeros AUTHOR_SORT_LIMIT resultados
  const isAuthorSort = sort === 'author'
  const pageableTotal = isAuthorSort ? Math.min(total, AUTHOR_SORT_LIMIT) : total
  const totalPages = Math.ceil(pageableTotal / PAGE_SIZE)
  const hasFilters = searchText !== '' || category !== null

  // Disponibilidad de los libros de la página: una sola consulta para todos
  const { loans } = useLibrary()
  const { byWorkId } = useAvailability(books.map((book) => book.id))

  function updateParam(name: string, value: string) {
    setSearchParams(
      (params) => {
        if (value) {
          params.set(name, value)
        } else {
          params.delete(name)
        }
        // Cualquier cambio de busqueda o filtro vuelve a la pagina 1
        params.delete('page')
        return params
      },
      { replace: true },
    )
  }

  // Sin replace: cada pagina crea una entrada en el historial, asi "Atras" vuelve a la anterior
  function goToPage(newPage: number) {
    setSearchParams((params) => {
      if (newPage > 1) {
        params.set('page', String(newPage))
      } else {
        params.delete('page')
      }
      return params
    })
    window.scrollTo({ top: 0 })
  }

  // Quita la búsqueda y la categoría; el orden elegido se mantiene
  function clearFilters() {
    setSearchParams(
      (params) => {
        params.delete('q')
        params.delete('category')
        params.delete('page')
        return params
      },
      { replace: true },
    )
  }

  return (
    <>
      <PageTitle title="Catalog" />
      <h1>Catalog</h1>
      <div className={styles.toolbar}>
        <SearchBar value={searchText} onChange={(value) => updateParam('q', value)} />
        <FilterBar
          category={category ?? ''}
          sort={sort}
          onCategoryChange={(value) => updateParam('category', value)}
          onSortChange={(value) => updateParam('sort', value)}
        />
      </div>

      {error ? (
        <ErrorMessage message={error} onRetry={retry} />
      ) : (
        <>
          {/* Siempre presente: el lector de pantalla anuncia cada cambio de texto ("Cargando..." → "120 resultados") */}
          <p className={styles.summary} role="status">
            {isLoading ? (
              'Loading books...'
            ) : (
              <>
                {total.toLocaleString('en')} {total === 1 ? 'result' : 'results'}
                {isSearching && <> for “{debouncedText}”</>}
              </>
            )}
          </p>
          {!isLoading && isAuthorSort && total > AUTHOR_SORT_LIMIT && (
            <p className={styles.summary}>
              Sorted by author among the {AUTHOR_SORT_LIMIT} most relevant results.
            </p>
          )}

          {books.length > 0 ? (
            // Mientras llega la nueva búsqueda se siguen viendo los resultados anteriores, atenuados
            <div className={styles.results} aria-busy={isLoading}>
              <ul className={styles.grid} role="list">
                {books.map((book) => (
                  <li key={book.id}>
                    <BookCard
                      book={book}
                      availability={
                        byWorkId
                          ? getBookAvailability(byWorkId.get(book.id), findActiveLoan(loans, book.id))
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ul>
              <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
            </div>
          ) : isLoading ? (
            // Primera carga: tarjetas de relleno con la forma de la grilla. aria-hidden: son decorativas,
            // el lector de pantalla ya escucha "Cargando libros..." del role="status"
            <ul className={styles.grid} aria-hidden="true">
              {Array.from({ length: PAGE_SIZE }, (_, index) => (
                <li key={index} className={`${skeletonStyles.block} ${styles.placeholder}`} />
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No books found</p>
              <p className={styles.emptyHint}>Try other words or another category.</p>
              {hasFilters && (
                <button type="button" onClick={clearFilters}>
                  Clear search and filters
                </button>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}

export default Home
