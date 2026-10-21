import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Falla con un mensaje claro si falta configurar el .env, en vez de un error confuso mas adelante
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in the .env file')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
