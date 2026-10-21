import { useEffect, useReducer, useState } from 'react'
import { searchBooks, type BookSearchOptions } from '../api/openLibrary.ts'
import type { BookSummary } from '../types/book.ts'

interface State {
  // A qué búsqueda pertenecen los datos (parámetros + intento)
  key: string | null
  books: BookSummary[]
  total: number
  error: string | null
}

type Action =
  | { type: 'success'; key: string; books: BookSummary[]; total: number }
  | { type: 'error'; key: string; message: string }

const initialState: State = {
  key: null,
  books: [],
  total: 0,
  error: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'success':
      return { key: action.key, books: action.books, total: action.total, error: null }
    case 'error':
      // Los libros anteriores se conservan: se siguen viendo (atenuados) al reintentar
      return { ...state, key: action.key, error: action.message }
  }
}

export function useBooks({ query, page, subject, sort }: BookSearchOptions) {
  const [state, dispatch] = useReducer(reducer, initialState)
  // Contador de reintentos: al cambiar, el efecto vuelve a pedir la misma busqueda
  const [attempt, setAttempt] = useState(0)
  // Identifica la búsqueda actual; si los datos guardados son de otra, todavía está cargando
  const requestKey = JSON.stringify([query, page, subject, sort, attempt])

  useEffect(() => {
    const controller = new AbortController()

    searchBooks({ query, page, subject, sort }, controller.signal)
      .then((result) => {
        dispatch({ type: 'success', key: requestKey, books: result.books, total: result.total })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          dispatch({ type: 'error', key: requestKey, message: 'Could not load books. Please try again.' })
        }
      })

    return () => controller.abort()
  }, [query, page, subject, sort, requestKey])

  // isLoading se deriva en vez de guardarse: no hace falta un dispatch('loading') dentro del efecto
  const isLoading = state.key !== requestKey

  function retry() {
    setAttempt((current) => current + 1)
  }

  return {
    books: state.books,
    total: state.total,
    isLoading,
    error: isLoading ? null : state.error,
    retry,
  }
}
