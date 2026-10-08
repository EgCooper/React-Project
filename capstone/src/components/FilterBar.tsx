import { CATEGORIES, SORT_OPTIONS } from '../constants/catalog.ts'
import './FilterBar.css'

interface FilterBarProps {
  category: string
  sort: string
  onCategoryChange: (value: string) => void
  onSortChange: (value: string) => void
}

function FilterBar({ category, sort, onCategoryChange, onSortChange }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-bar__field">
        <label htmlFor="category-filter">Categoría</label>
        <select
          id="category-filter"
          className="filter-bar__select"
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

      <div className="filter-bar__field">
        <label htmlFor="sort-filter">Ordenar por</label>
        <select
          id="sort-filter"
          className="filter-bar__select"
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
