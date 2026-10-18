import { TEST_USER_ID } from './auth.ts'

const DAY_MS = 24 * 60 * 60 * 1000

// Fecha ISO a N días de hoy (negativo = en el pasado)
export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

// Fila de la tabla loans con la forma que devuelve Supabase
export function loanRow(id: number, workId: string, title: string, changes: Record<string, unknown> = {}) {
  return {
    id,
    user_id: TEST_USER_ID,
    work_id: workId,
    title,
    cover_id: null,
    borrowed_at: daysFromNow(-3),
    due_at: daysFromNow(11),
    returned_at: null,
    ...changes,
  }
}

export function reservationRow(id: number, workId: string, title: string) {
  return { id, user_id: TEST_USER_ID, work_id: workId, title, cover_id: null, status: 'active', created_at: daysFromNow(-1) }
}
