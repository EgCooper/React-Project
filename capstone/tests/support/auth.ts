import { http, HttpResponse } from 'msw'
import { supabase } from '../../src/api/supabase.ts'
import { SUPABASE_AUTH_URL } from './handlers.ts'
import { server } from './server.ts'

export const TEST_USER_ID = '11111111-1111-1111-1111-111111111111'

// Respuesta de Supabase a un inicio de sesión correcto (forma real, datos falsos)
export function sessionResponse(email: string) {
  return HttpResponse.json({
    access_token: 'token-de-prueba',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'refresh-de-prueba',
    user: {
      id: TEST_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      app_metadata: { provider: 'email' },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  })
}

// Inicia sesión antes de renderizar la app, sin pasar por el formulario.
// Cerrar la sesión al terminar cada prueba: supabase.auth.signOut() en afterEach
export async function signInTestUser(email = 'ana@correo.com') {
  server.use(http.post(`${SUPABASE_AUTH_URL}/token`, () => sessionResponse(email)))
  const { error } = await supabase.auth.signInWithPassword({ email, password: 'Correcta123' })

  if (error) {
    throw error
  }
}
