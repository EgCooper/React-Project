import { supabase } from './supabase.ts'

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}
