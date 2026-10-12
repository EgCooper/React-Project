import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server.ts'

// onUnhandledRequest: 'error' -> si una prueba hace una petición que nadie simuló, falla en vez de salir a internet
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  // Desmonta lo que renderizó la prueba anterior y borra las respuestas que agregó
  cleanup()
  server.resetHandlers()
})

afterAll(() => server.close())
