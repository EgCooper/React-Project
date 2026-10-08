import { useSearchParams } from 'react-router'
import BookCard from '../components/BookCard.tsx'
import SearchBar from '../components/SearchBar.tsx'
import { useBooks } from '../hooks/useBooks.ts'
import { useDebounce } from '../hooks/useDebounce.ts'
import FilterBar from '../components/FilterBar.tsx'
import { CATEGORIES, SORT_OPTIONS } from '../constants/catalog.ts'

import './Home.css'

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
  const category = CATEGORIES.find((option) => option.value === searchParams.get('categoria'))?.value ?? null
  const sort = SORT_OPTIONS.find((option) => option.value === searchParams.get('orden'))?.value ?? 'relevance'

  const { books, total, isLoading, error } = useBooks({ query, page: 1, subject: category, sort })

  function updateParam(name: string, value: string) {
    setSearchParams(
      (params) => {
        if (value) {
          params.set(name, value)
        } else {
          params.delete(name)
        }
        return params
      },
      { replace: true },
    )
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
      {error && <p role="alert">{error}</p>}

      {!isLoading && !error && (
        <>
          <p>
            {total.toLocaleString('es')} resultados
            {isSearching && <> para «{debouncedText}»</>}
          </p>
          {books.length === 0 ? (
            <p>No se encontraron libros.</p>
          ) : (
            <ul className="book-grid" role="list">
              {books.map((book) => (
                <li key={book.id}>
                  <BookCard book={book} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}

export default Home
