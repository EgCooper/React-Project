import BookCard from '../components/BookCard.tsx'
import { useBooks } from '../hooks/useBooks.ts'
import './Home.css'

const DEFAULT_QUERY = 'language:spa'

function Home() {
  const { books, total, isLoading, error } = useBooks({ query: DEFAULT_QUERY, page: 1 })

  return (
    <>
      <h1>Catálogo</h1>

      {isLoading && <p role="status">Cargando libros...</p>}
      {error && <p role="alert">{error}</p>}

      {!isLoading && !error && (
        <>
          <p>{total.toLocaleString('es')} resultados</p>
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
