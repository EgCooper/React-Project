import { useEffect, useState } from 'react'
import { getBookDetail } from '../api/openLibrary.ts'
import type { BookDetail } from '../types/book.ts'

type BookDetailState =
  | { status: 'loading' }
  | { status: 'success'; book: BookDetail }
  | { status: 'not-found' }
  | { status: 'error' }

// Resultado de una peticion, junto con la peticion a la que pertenece
interface FetchResult {
  requestKey: string
  state: BookDetailState
}

export function useBookDetail(id: string) {
  // Contador de reintentos: al cambiar, el efecto vuelve a pedir el mismo libro
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<FetchResult | null>(null)
  const requestKey = `${id}#${attempt}`

  useEffect(() => {
    const controller = new AbortController()

    getBookDetail(id, controller.signal)
      .then((book) => {
        setResult({ requestKey, state: book ? { status: 'success', book } : { status: 'not-found' } })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ requestKey, state: { status: 'error' } })
        }
      })

    return () => controller.abort()
  }, [id, requestKey])

  // Si el resultado guardado es de otra peticion (otro libro u otro intento), todavia estamos cargando
  const state: BookDetailState = result?.requestKey === requestKey ? result.state : { status: 'loading' }

  function retry() {
    setAttempt((current) => current + 1)
  }

  return { state, retry }
}
