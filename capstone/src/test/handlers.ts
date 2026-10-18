import { http, HttpResponse } from 'msw'

// Mismas URLs falsas que define vite.config.ts en test.env
export const SUPABASE_REST_URL = 'https://supabase.test/rest/v1'
export const SUPABASE_AUTH_URL = 'https://supabase.test/auth/v1'

// Respuestas por defecto de Supabase: sin préstamos, sin reservas, sin lista y todos los libros disponibles.
// Cada prueba puede reemplazarlas con server.use(...); server.resetHandlers() vuelve a estas
export const defaultHandlers = [
  http.post(`${SUPABASE_REST_URL}/rpc/get_availability`, () => HttpResponse.json([])),
  http.get(`${SUPABASE_REST_URL}/loans`, () => HttpResponse.json([])),
  http.get(`${SUPABASE_REST_URL}/reservations`, () => HttpResponse.json([])),
  http.get(`${SUPABASE_REST_URL}/reading_status`, () => HttpResponse.json([])),
  http.post(`${SUPABASE_AUTH_URL}/logout`, () => new HttpResponse(null, { status: 204 })),
]
