import { isAuthError } from '@supabase/supabase-js'
import { supabase } from './supabase.ts'

// Supabase responde en ingles; traducimos por codigo de error (estable), no por el texto
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  user_already_exists: 'An account with that email already exists.',
  email_exists: 'An account with that email already exists.',
  weak_password: 'The password does not meet the security requirements.',
  email_address_invalid: 'The email address is not valid.',
  over_request_rate_limit: 'Too many attempts. Wait a few minutes and try again.',
  invalid_credentials: 'Incorrect email or password.',
}

export function getAuthErrorMessage(error: unknown): string {
  if (isAuthError(error) && error.code && error.code in AUTH_ERROR_MESSAGES) {
    return AUTH_ERROR_MESSAGES[error.code]
  }

  return 'Something went wrong. Please try again.'
}

export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    throw error
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })

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
