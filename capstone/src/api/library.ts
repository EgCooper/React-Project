import type { Availability, BookRef, Loan, ReadingEntry, ReadingStatus, Reservation } from '../types/library.ts'
import { supabase } from './supabase.ts'

// Filas tal como las devuelve Supabase (nombres de columna en snake_case)
interface LoanRow {
  id: number
  work_id: string
  title: string
  cover_id: number | null
  borrowed_at: string
  due_at: string
  returned_at: string | null
}

interface ReservationRow {
  id: number
  work_id: string
  title: string
  cover_id: number | null
  created_at: string
}

interface ReadingRow {
  work_id: string
  title: string
  cover_id: number | null
  status: ReadingStatus
}

interface AvailabilityRow {
  work_id: string
  due_at: string | null
  queue_length: number
  my_queue_position: number | null
}

// Supabase -> app (camelCase, igual que BookSummary)
function toLoan(row: LoanRow): Loan {
  return {
    id: row.id,
    workId: row.work_id,
    title: row.title,
    coverId: row.cover_id,
    borrowedAt: row.borrowed_at,
    dueAt: row.due_at,
    returnedAt: row.returned_at,
  }
}

function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    workId: row.work_id,
    title: row.title,
    coverId: row.cover_id,
    createdAt: row.created_at,
  }
}

function toReadingEntry(row: ReadingRow): ReadingEntry {
  return { workId: row.work_id, title: row.title, coverId: row.cover_id, status: row.status }
}

function toAvailability(row: AvailabilityRow): Availability {
  return {
    workId: row.work_id,
    dueAt: row.due_at,
    queueLength: row.queue_length,
    myQueuePosition: row.my_queue_position,
  }
}

// Parámetros de borrow_book y reserve_book (los nombres p_... de las funciones SQL)
function toBookParams(book: BookRef) {
  return { p_work_id: book.id, p_title: book.title, p_cover_id: book.coverId }
}

// P0001 = error lanzado por nuestras funciones SQL (raise exception): su mensaje ya está escrito para el usuario.
// Supabase entrega el error como objeto simple { code, message, details, hint }, por eso se revisan sus campos
function isBusinessRuleError(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P0001' &&
    'message' in error &&
    typeof error.message === 'string'
  )
}

// Cualquier otro error es técnico y no se muestra tal cual
export function getLibraryErrorMessage(error: unknown): string {
  if (isBusinessRuleError(error)) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

// ---------- Lecturas (RLS: cada usuario solo recibe sus filas) ----------

export async function getMyLoans(): Promise<Loan[]> {
  const { data, error } = await supabase.from('loans').select('*').order('borrowed_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data as LoanRow[]).map(toLoan)
}

// Solo las reservas en espera; las cumplidas o canceladas no se muestran
export async function getMyReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('id, work_id, title, cover_id, created_at')
    .eq('status', 'active')
    .order('created_at')

  if (error) {
    throw error
  }

  return (data as ReservationRow[]).map(toReservation)
}

export async function getMyReadingList(): Promise<ReadingEntry[]> {
  const { data, error } = await supabase.from('reading_status').select('work_id, title, cover_id, status')

  if (error) {
    throw error
  }

  return (data as ReadingRow[]).map(toReadingEntry)
}

// Una sola consulta para todos los libros de una página; también funciona sin sesión
export async function getAvailability(workIds: string[], signal?: AbortSignal): Promise<Availability[]> {
  let request = supabase.rpc('get_availability', { work_ids: workIds })

  if (signal) {
    request = request.abortSignal(signal)
  }

  const { data, error } = await request

  if (error) {
    throw error
  }

  return (data as AvailabilityRow[]).map(toAvailability)
}

// ---------- Escrituras de préstamos y reservas (solo con las funciones SQL) ----------

export async function borrowBook(book: BookRef): Promise<Loan> {
  const { data, error } = await supabase.rpc('borrow_book', toBookParams(book))

  if (error) {
    throw error
  }

  return toLoan(data as LoanRow)
}

export async function returnBook(loanId: number): Promise<Loan> {
  const { data, error } = await supabase.rpc('return_book', { p_loan_id: loanId })

  if (error) {
    throw error
  }

  return toLoan(data as LoanRow)
}

export async function reserveBook(book: BookRef): Promise<Reservation> {
  const { data, error } = await supabase.rpc('reserve_book', toBookParams(book))

  if (error) {
    throw error
  }

  return toReservation(data as ReservationRow)
}

export async function cancelReservation(reservationId: number): Promise<void> {
  const { error } = await supabase.rpc('cancel_reservation', { p_reservation_id: reservationId })

  if (error) {
    throw error
  }
}

// ---------- Estado de lectura (tabla propia del usuario: se escribe directo) ----------

// upsert: si el libro ya tiene estado lo cambia, si no lo crea. user_id lo pone la base de datos (default auth.uid())
export async function saveReadingStatus(book: BookRef, status: ReadingStatus): Promise<ReadingEntry> {
  const { data, error } = await supabase
    .from('reading_status')
    .upsert({ work_id: book.id, title: book.title, cover_id: book.coverId, status }, { onConflict: 'user_id,work_id' })
    .select('work_id, title, cover_id, status')
    .single()

  if (error) {
    throw error
  }

  return toReadingEntry(data as ReadingRow)
}

export async function removeReadingStatus(workId: string): Promise<void> {
  const { error } = await supabase.from('reading_status').delete().eq('work_id', workId)

  if (error) {
    throw error
  }
}
