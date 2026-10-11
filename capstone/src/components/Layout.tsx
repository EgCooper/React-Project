import { Link, NavLink, Outlet } from 'react-router'
import { signOut } from '../api/auth.ts'
import { useAuth } from '../hooks/useAuth.ts'
import styles from './Layout.module.css'

function Layout() {
  const { user, isLoading } = useAuth()

  function handleSignOut() {
    signOut().catch(() => {
      window.alert('No se pudo cerrar la sesión. Intenta de nuevo.')
    })
  }

  return (
    <>
      <a href="#contenido" className={styles.skipLink}>
        Saltar al contenido
      </a>

      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <Link to="/" className={styles.brand}>
            Biblioteca Universitaria
          </Link>

          <nav aria-label="Principal">
            <ul className={styles.navList} role="list">
              <li>
                <NavLink to="/" end className={styles.navLink}>
                  Catálogo
                </NavLink>
              </li>
              <li>
                <NavLink to="/mis-prestamos" className={styles.navLink}>
                  Mis préstamos
                </NavLink>
              </li>
            </ul>
          </nav>

          {!isLoading && (
            <div className={styles.session}>
              {user ? (
                <>
                  <span className={styles.userEmail} title={user.email}>
                    {user.email}
                  </span>
                  <button type="button" onClick={handleSignOut}>
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link to="/iniciar-sesion">Iniciar sesión</Link>
                  <Link to="/registro" className={styles.primaryLink}>
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* tabIndex={-1}: puede recibir el foco desde "Saltar al contenido" sin entrar en el recorrido con Tab */}
      <main id="contenido" className={`${styles.container} ${styles.main}`} tabIndex={-1}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>
            Biblioteca Universitaria · Datos de libros de <a href="https://openlibrary.org">Open Library</a>
          </p>
        </div>
      </footer>
    </>
  )
}

export default Layout
