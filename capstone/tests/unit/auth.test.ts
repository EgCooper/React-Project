import { AuthApiError } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage } from '../../src/api/auth.ts'

const GENERIC_MESSAGE = 'No se pudo completar la operación. Intenta de nuevo.'

describe('getAuthErrorMessage', () => {
  // Supabase responde en inglés; se traduce por el código de error, que no cambia
  it.each([
    ['invalid_credentials', 'Correo o contraseña incorrectos.'],
    ['user_already_exists', 'Ya existe una cuenta con ese correo.'],
    ['email_exists', 'Ya existe una cuenta con ese correo.'],
    ['weak_password', 'La contraseña no cumple los requisitos de seguridad.'],
    ['over_request_rate_limit', 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'],
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
