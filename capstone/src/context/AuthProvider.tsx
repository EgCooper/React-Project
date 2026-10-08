import { useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../api/supabase.ts'
import { AuthContext } from './authContext.ts'

interface AuthProviderProps {
  children: ReactNode
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Supabase avisa cada vez que cambia la sesion: al cargar (INITIAL_SESSION), al entrar, al salir y al renovar el token
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  return <AuthContext value={{ user, isLoading }}>{children}</AuthContext>
}

export default AuthProvider
