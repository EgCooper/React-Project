import { useEffect, useState } from 'react'
import { getAvailability } from '../api/library.ts'
import type { Availability } from '../types/library.ts'
import { useAuth } from './useAuth.ts'
import { useLibrary } from './useLibrary.ts'

interface AvailabilityResult {
  // Para qué libros es
  idsKey: string
  // Para qué consulta exacta es (libros + usuario + revisión)
  requestKey: string
  byWorkId: Map<string, Availability> | null
}

export interface UseAvailabilityResult {
  status: 'loading' | 'ready' | 'error'
  // null = todavía no se sabe (o falló). Un libro que no está en el Map está disponible
  byWorkId: Map<string, Availability> | null
}

const EMPTY: Map<string, Availability> = new Map()

// Disponibilidad de varios libros con una sola consulta. Se vuelve a pedir si cambian los libros,
// el usuario (su lugar en la fila depende de quién pregunta) o tras un préstamo, devolución o reserva
export function useAvailability(workIds: string[]): UseAvailabilityResult {
  const { user, isLoading: isAuthLoading } = useAuth()
  const { revision } = useLibrary()
  const [result, setResult] = useState<AvailabilityResult | null>(null)

  // Texto en lugar del array: un array nuevo en cada render no debe disparar otra consulta
  const idsKey = workIds.join(',')
  const requestKey = `${idsKey}|${user?.id ?? ''}|${revision}`

  useEffect(() => {
    // Sin libros no hay nada que consultar; mientras se recupera la sesión, se espera para no consultar dos veces
    if (!idsKey || isAuthLoading) {
      return
    }

    const controller = new AbortController()

    getAvailability(idsKey.split(','), controller.signal)
      .then((rows) => {
        setResult({ idsKey, requestKey, byWorkId: new Map(rows.map((row) => [row.workId, row])) })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ idsKey, requestKey, byWorkId: null })
        }
      })

    return () => controller.abort()
  }, [idsKey, requestKey, isAuthLoading])

  if (!idsKey) {
    return { status: 'ready', byWorkId: EMPTY }
  }

  // Un resultado de otros libros no sirve. Uno de los mismos libros sí se muestra mientras se actualiza
  if (!result || result.idsKey !== idsKey) {
    return { status: 'loading', byWorkId: null }
  }

  if (result.requestKey !== requestKey) {
    return { status: 'loading', byWorkId: result.byWorkId }
  }

  return { status: result.byWorkId ? 'ready' : 'error', byWorkId: result.byWorkId }
}
