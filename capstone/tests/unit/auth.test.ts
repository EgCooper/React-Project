import { AuthApiError } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage } from '../../src/api/auth.ts'

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

describe('getAuthErrorMessage', () => {
  // Supabase responde en inglés; se traduce por el código de error, que no cambia
  it.each([
    ['invalid_credentials', 'Incorrect email or password.'],
    ['user_already_exists', 'An account with that email already exists.'],
    ['email_exists', 'An account with that email already exists.'],
    ['weak_password', 'The password does not meet the security requirements.'],
    ['over_request_rate_limit', 'Too many attempts. Wait a few minutes and try again.'],
  ])('traduce el código %s', (code, message) => {
    expect(getAuthErrorMessage(new AuthApiError('Error en inglés', 400, code))).toBe(message)
  })

  it('usa un mensaje genérico para códigos desconocidos o errores que no son de Supabase', () => {
    expect(getAuthErrorMessage(new AuthApiError('Algo raro', 500, 'unexpected_failure'))).toBe(GENERIC_MESSAGE)
    expect(getAuthErrorMessage(new AuthApiError('Sin código', 500, undefined))).toBe(GENERIC_MESSAGE)
    expect(getAuthErrorMessage(new Error('Failed to fetch'))).toBe(GENERIC_MESSAGE)
    expect(getAuthErrorMessage('texto')).toBe(GENERIC_MESSAGE)
  })
})
