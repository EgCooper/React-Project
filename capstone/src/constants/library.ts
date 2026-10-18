import type { ReadingStatus } from '../types/library.ts'

// Las mismas reglas que aplica la función borrow_book en la base de datos (supabase/schema.sql).
// Aquí solo se usan para informar; quien las hace cumplir es el servidor
export const LOAN_DAYS = 14
export const MAX_ACTIVE_LOANS = 3

export const READING_STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: 'wishlist', label: 'Lista de deseos' },
  { value: 'reading', label: 'Leyendo' },
  { value: 'completed', label: 'Completado' },
]
