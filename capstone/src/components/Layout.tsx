import { Link, NavLink, Outlet } from 'react-router'
import { signOut } from '../api/auth.ts'
import { useAuth } from '../hooks/useAuth.ts'

function Layout() {
  const { user, isLoading } = useAuth()

  function handleSignOut() {
    signOut().catch(() => {
      window.alert('No se pudo cerrar la sesión. Intenta de nuevo.')
    })
  }

  return (
    <>
      <header>
        <nav aria-label="Principal">
          <ul>
            <li>
              <NavLink to="/" end>Catálogo</NavLink>
            </li>
            <li>
              <NavLink to="/mis-prestamos">Mis préstamos</NavLink>
            </li>
          </ul>
        </nav>

        {!isLoading && (
          <div>
            {user ? (
              <>
                <span>{user.email}</span>
                <button type="button" onClick={handleSignOut}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/iniciar-sesion">Iniciar sesión</Link>
                <Link to="/registro">Crear cuenta</Link>
              </>
            )}
          </div>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default Layout
