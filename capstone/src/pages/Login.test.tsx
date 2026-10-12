import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp.tsx'
import { server } from '../test/server.ts'

// Misma URL falsa que define vite.config.ts en test.env
const SUPABASE_AUTH_URL = 'https://supabase.test/auth/v1'

// Respuesta de Supabase a un inicio de sesión correcto (forma real, datos falsos)
function sessionResponse(email: string) {
  return HttpResponse.json({
    access_token: 'token-de-prueba',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'refresh-de-prueba',
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      aud: 'authenticated',
      role: 'authenticated',
      email,
      app_metadata: { provider: 'email' },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  })
}

describe('Inicio de sesión y rutas protegidas (integración)', () => {
  it('valida el formulario sin llamar a Supabase y enfoca el primer campo inválido', async () => {
    const { user } = renderApp('/iniciar-sesion')

    await user.click(await screen.findByRole('button', { name: 'Iniciar sesión' }))

    const email = screen.getByLabelText('Correo electrónico')
    expect(screen.getByText('Escribe tu correo.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument()
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveFocus()
  })

  it('con credenciales incorrectas muestra el error de Supabase traducido', async () => {
    server.use(
      http.post(`${SUPABASE_AUTH_URL}/token`, () =>
        HttpResponse.json(
          { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' },
          { status: 400 },
        ),
      ),
    )
    const { user } = renderApp('/iniciar-sesion')

    await user.type(await screen.findByLabelText('Correo electrónico'), 'ana@correo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Incorrecta1')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
  })

  it('sin sesión, "Mis préstamos" lleva al login; al entrar vuelve ahí y "Cerrar sesión" la protege de nuevo', async () => {
    server.use(
      http.post(`${SUPABASE_AUTH_URL}/token`, () => sessionResponse('ana@correo.com')),
      http.post(`${SUPABASE_AUTH_URL}/logout`, () => new HttpResponse(null, { status: 204 })),
    )
    const { user } = renderApp('/mis-prestamos')

    // ProtectedRoute redirige al login
    expect(await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Correcta123')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    // Después de iniciar sesión vuelve a la página que pidió, y el header muestra el correo
    expect(await screen.findByRole('heading', { level: 1, name: 'Mis préstamos' })).toBeInTheDocument()
    expect(screen.getByText('ana@correo.com')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument()
  })
})
