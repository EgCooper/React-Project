import { setupServer } from 'msw/node'
import { defaultHandlers } from './handlers.ts'

// Servidor falso de MSW: arranca con las respuestas por defecto y cada prueba agrega las suyas con server.use(...)
export const server = setupServer(...defaultHandlers)
