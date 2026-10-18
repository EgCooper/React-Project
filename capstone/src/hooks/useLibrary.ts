import { useContext } from 'react'
import { LibraryContext, type LibraryContextValue } from '../context/libraryContext.ts'

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext)

  if (!context) {
    throw new Error('useLibrary debe usarse dentro de <LibraryProvider>')
  }

  return context
}
