import { CATEGORIES, SORT_OPTIONS } from '../constants/catalog.ts'
import styles from './FilterBar.module.css'

interface FilterBarProps {
  category: string
  sort: string
  onCategoryChange: (value: string) => void
  onSortChange: (value: string) => void
}

function FilterBar({ category, sort, onCategoryChange, onSortChange }: FilterBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.field}>
        <label htmlFor="category-filter">Categoría</label>
        <select
          id="category-filter"
          className={styles.select}
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">Todas</option>
          {CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="sort-filter">Ordenar por</label>
        <select
          id="sort-filter"
          className={styles.select}
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default FilterBar
