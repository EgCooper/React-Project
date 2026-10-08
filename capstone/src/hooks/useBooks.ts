import { useEffect, useReducer } from 'react'
import { searchBooks, type BookSearchOptions } from '../api/openLibrary.ts'
import type { BookSummary } from '../types/book.ts'

interface State {
  books: BookSummary[]
  total: number
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: 'loading' }
  | { type: 'success'; payload: { books: BookSummary[]; total: number } }
  | { type: 'error'; payload: string }

const initialState: State = {
  books: [],
  total: 0,
  isLoading: true,
  error: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { ...state, isLoading: true, error: null }
    case 'success':
      return { ...state, books: action.payload.books, total: action.payload.total, isLoading: false, error: null }
    case 'error':
      return { ...state, isLoading: false, error: action.payload }
  }
}

export function useBooks({ query, page, subject, sort }: BookSearchOptions) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const controller = new AbortController()

    dispatch({ type: 'loading' })

    searchBooks({ query, page, subject, sort }, controller.signal)
      .then((result) => {
        dispatch({ type: 'success', payload: { books: result.books, total: result.total } })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          dispatch({ type: 'error', payload: 'No se pudieron cargar los libros. Intenta de nuevo.' })
        }
      })

    return () => controller.abort()
  }, [query, page, subject, sort])

  return state
}