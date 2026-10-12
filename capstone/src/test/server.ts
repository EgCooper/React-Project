import { setupServer } from 'msw/node'

// Servidor falso de MSW: cada prueba le dice qué responder con server.use(...)
export const server = setupServer()
