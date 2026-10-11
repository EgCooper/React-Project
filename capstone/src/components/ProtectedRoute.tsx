import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth.ts'

function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // Mientras Supabase recupera la sesion no sabemos si hay usuario: no redirigir todavia
  if (isLoading) {
    return <p role="status">Comprobando sesión...</p>
  }

  if (!user) {
    // Recordamos la pagina pedida para volver a ella despues de iniciar sesion
    return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}

export default ProtectedRoute
