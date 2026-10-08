import { isAuthError } from '@supabase/supabase-js'
import { supabase } from './supabase.ts'

// Supabase responde en ingles; traducimos por codigo de error (estable), no por el texto
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  user_already_exists: 'Ya existe una cuenta con ese correo.',
  email_exists: 'Ya existe una cuenta con ese correo.',
  weak_password: 'La contraseña no cumple los requisitos de seguridad.',
  email_address_invalid: 'El correo no es válido.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  invalid_credentials: 'Correo o contraseña incorrectos.',
}

export function getAuthErrorMessage(error: unknown): string {
  if (isAuthError(error) && error.code && error.code in AUTH_ERROR_MESSAGES) {
    return AUTH_ERROR_MESSAGES[error.code]
  }

  return 'No se pudo completar la operación. Intenta de nuevo.'
}

export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    throw error
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}
