import { useState } from 'react'
import { getLibraryErrorMessage } from '../../api/library.ts'
import { READING_STATUS_OPTIONS } from '../../constants/library.ts'
import { useLibrary } from '../../hooks/useLibrary.ts'
import type { BookRef, ReadingEntry } from '../../types/library.ts'
import ErrorMessage from '../ErrorMessage/ErrorMessage.tsx'
import styles from './ReadingStatusField.module.css'

interface ReadingStatusFieldProps {
  book: BookRef
  entry: ReadingEntry | undefined
}

// Rastreador de lectura: Lista de deseos / Leyendo / Completado
function ReadingStatusField({ book, entry }: ReadingStatusFieldProps) {
  const { setReadingStatus } = useLibrary()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(value: string) {
    setIsSaving(true)
    setError(null)

    try {
      // Solo se aceptan los valores de la lista; "" = sin estado
      const status = READING_STATUS_OPTIONS.find((option) => option.value === value)?.value ?? null
      await setReadingStatus(book, status)
    } catch (caught) {
      setError(getLibraryErrorMessage(caught))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.reading}>
      <label htmlFor="reading-status">My reading status</label>
      {/* No se deshabilita mientras guarda: un control deshabilitado pierde el foco del teclado */}
      <select
        id="reading-status"
        className={styles.select}
        value={entry?.status ?? ''}
        onChange={(event) => handleChange(event.target.value)}
        aria-describedby="reading-status-hint"
      >
        <option value="">No status</option>
        {READING_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p id="reading-status-hint" className={styles.hint}>
        {isSaving ? 'Saving...' : 'You’ll see it in “My books”.'}
      </p>
      {error && <ErrorMessage message={error} />}
    </div>
  )
}

export default ReadingStatusField
