import { useSearchParams } from 'react-router'
import BookCard from '../components/BookCard.tsx'
import SearchBar from '../components/SearchBar.tsx'
import { useBooks } from '../hooks/useBooks.ts'
import { useDebounce } from '../hooks/useDebounce.ts'
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

  const { books, total, isLoading, error } = useBooks({ query, page: 1 })

  function handleSearchChange(value: string) {
    setSearchParams(
      (params) => {
        if (value) {
          params.set('q', value)
        } else {
          params.delete('q')
        }
        return params
      },
      { replace: true },
    )
  }

  return (
    <>
      <h1>Catálogo</h1>
      <SearchBar value={searchText} onChange={handleSearchChange} />

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
