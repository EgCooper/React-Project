import styles from './SearchBar.module.css'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <form className={styles.form} role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="book-search">Search books</label>
      <input
        id="book-search"
        className={styles.input}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Title, author or keyword"
        maxLength={100}
        autoComplete="off"
      />
    </form>
  )
}

export default SearchBar
