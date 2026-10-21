import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { sessionResponse } from '../support/auth.ts'
import { SUPABASE_AUTH_URL } from '../support/handlers.ts'
import { renderApp } from '../support/renderApp.tsx'
import { server } from '../support/server.ts'

describe('Inicio de sesión y rutas protegidas (integración)', () => {
  it('valida el formulario sin llamar a Supabase y enfoca el primer campo inválido', async () => {
    const { user } = renderApp('/login')

    await user.click(await screen.findByRole('button', { name: 'Sign in' }))

    const email = screen.getByLabelText('Email')
    expect(screen.getByText('Enter your email.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
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
    const { user } = renderApp('/login')

    await user.type(await screen.findByLabelText('Email'), 'ana@correo.com')
    await user.type(screen.getByLabelText('Password'), 'Incorrecta1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.')
  })

  it('sin sesión, "Mis préstamos" lleva al login; al entrar vuelve ahí y "Cerrar sesión" la protege de nuevo', async () => {
    server.use(
      http.post(`${SUPABASE_AUTH_URL}/token`, () => sessionResponse('ana@correo.com')),
    )
    const { user } = renderApp('/my-loans')

    // ProtectedRoute redirige al login
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'ana@correo.com')
    await user.type(screen.getByLabelText('Password'), 'Correcta123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    // Después de iniciar sesión vuelve a la página que pidió, y el header muestra el correo
    expect(await screen.findByRole('heading', { level: 1, name: 'My loans' })).toBeInTheDocument()
    expect(screen.getByText('ana@correo.com')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create account' })).toBeInTheDocument()
  })
})
