import { useSearchParams } from 'react-router'
import BookCard from '../components/BookCard.tsx'
import SearchBar from '../components/SearchBar.tsx'
import { useBooks } from '../hooks/useBooks.ts'
import { useDebounce } from '../hooks/useDebounce.ts'
import FilterBar from '../components/FilterBar.tsx'
import Pagination from '../components/Pagination.tsx'
import { CATEGORIES, SORT_OPTIONS } from '../constants/catalog.ts'
import { AUTHOR_SORT_LIMIT, PAGE_SIZE } from '../api/openLibrary.ts'

import styles from './Home.module.css'

const DEFAULT_QUERY = 'language:spa'
const SEARCH_DELAY_MS = 400
const HAS_LETTER_OR_NUMBER = /[\p{L}\p{N}]/u

// Convierte ?pagina= en un entero >= 1; cualquier otro valor ('abc', '-5', '2.5') vuelve a la pagina 1
function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchText = searchParams.get('q') ?? ''
  const debouncedText = useDebounce(searchText.trim(), SEARCH_DELAY_MS)
  const isSearching = HAS_LETTER_OR_NUMBER.test(debouncedText)
  const query = isSearching ? debouncedText : DEFAULT_QUERY

  // La URL la puede editar cualquiera: solo aceptamos valores que existan en las listas
  const category = CATEGORIES.find((option) => option.value === searchParams.get('categoria'))?.value ?? null
  const sort = SORT_OPTIONS.find((option) => option.value === searchParams.get('orden'))?.value ?? 'relevance'
  const page = parsePage(searchParams.get('pagina'))

  const { books, total, isLoading, error, retry } = useBooks({ query, page, subject: category, sort })
  // Al ordenar por autor solo se pueden recorrer los primeros AUTHOR_SORT_LIMIT resultados
  const isAuthorSort = sort === 'author'
  const pageableTotal = isAuthorSort ? Math.min(total, AUTHOR_SORT_LIMIT) : total
  const totalPages = Math.ceil(pageableTotal / PAGE_SIZE)

  function updateParam(name: string, value: string) {
    setSearchParams(
      (params) => {
        if (value) {
          params.set(name, value)
        } else {
          params.delete(name)
        }
        // Cualquier cambio de busqueda o filtro vuelve a la pagina 1
        params.delete('pagina')
        return params
      },
      { replace: true },
    )
  }

  // Sin replace: cada pagina crea una entrada en el historial, asi "Atras" vuelve a la anterior
  function goToPage(newPage: number) {
    setSearchParams((params) => {
      if (newPage > 1) {
        params.set('pagina', String(newPage))
      } else {
        params.delete('pagina')
      }
      return params
    })
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <h1>Catálogo</h1>
      <SearchBar value={searchText} onChange={(value) => updateParam('q', value)} />
      <FilterBar
        category={category ?? ''}
        sort={sort}
        onCategoryChange={(value) => updateParam('categoria', value)}
        onSortChange={(value) => updateParam('orden', value)}
      />

      {isLoading && <p role="status">Cargando libros...</p>}
      {error && (
        <div>
          <p role="alert">{error}</p>
          <button type="button" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <p>
            {total.toLocaleString('es')} resultados
            {isSearching && <> para «{debouncedText}»</>}
          </p>
          {isAuthorSort && total > AUTHOR_SORT_LIMIT && (
            <p>Ordenados por autor entre los {AUTHOR_SORT_LIMIT} resultados más relevantes.</p>
          )}
          {books.length === 0 ? (
            <p>No se encontraron libros.</p>
          ) : (
            <>
              <ul className={styles.grid} role="list">
                {books.map((book) => (
                  <li key={book.id}>
                    <BookCard book={book} />
                  </li>
                ))}
              </ul>
              <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
            </>
          )}
        </>
      )}
    </>
  )
}

export default Home
