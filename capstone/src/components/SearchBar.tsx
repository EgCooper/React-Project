import './SearchBar.css'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <form className="search-bar" role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="book-search">Buscar libros</label>
      <input
        id="book-search"
        className="search-bar__input"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Título, autor o palabra clave"
        maxLength={100}
        autoComplete="off"
      />
    </form>
  )
}

export default SearchBar
