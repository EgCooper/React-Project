import { Suspense, useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { signOut } from '../api/auth.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useWishlist } from '../hooks/useWishlist.ts'
import styles from './Layout.module.css'

function Layout() {
  const { user, isLoading } = useAuth()
  // Aviso del menú: cuántos libros de la lista de deseos se pueden pedir ahora
  const { availableCount } = useWishlist()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const previousPathname = useRef(pathname)

  // Al cambiar de página, el foco va al h1 de la nueva (o al main si aún no hay h1, ej. mientras carga).
  // Sin esto, el foco se queda en el enlace pulsado y el lector de pantalla no anuncia la página nueva.
  // Se compara con la ruta anterior para no mover el foco al cargar la app ni al escribir en el buscador
  useEffect(() => {
    if (previousPathname.current === pathname) {
      return
    }
    previousPathname.current = pathname

    // Con React.lazy, mientras se descarga la página nueva React deja la anterior oculta (display: none).
    // Ese h1 viejo no puede recibir el foco: se busca un h1 visible y, si aún no hay, se enfoca el main
    const headings = Array.from(mainRef.current?.querySelectorAll('h1') ?? [])
    const heading = headings.find((h1) => !h1.closest('[style*="display: none"]'))
    if (heading) {
      // tabindex="-1": el h1 puede recibir el foco por código sin entrar en el recorrido con Tab
      heading.setAttribute('tabindex', '-1')
      heading.focus()
    } else {
      mainRef.current?.focus()
    }
  }, [pathname])

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
              <li>
                <NavLink to="/mis-libros" className={styles.navLink}>
                  Mis libros
                  {availableCount > 0 && (
                    <>
                      {/* El número es visual; el lector de pantalla escucha la frase completa */}
                      <span className={styles.badge} aria-hidden="true">
                        {availableCount}
                      </span>
                      <span className={styles.visuallyHidden}>
                        {/* Empieza con coma: los espacios iniciales se pierden al calcular el nombre del enlace */}
                        {availableCount === 1
                          ? ', 1 libro de tu lista disponible'
                          : `, ${availableCount} libros de tu lista disponibles`}
                      </span>
                    </>
                  )}
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
      <main id="contenido" ref={mainRef} className={`${styles.container} ${styles.main}`} tabIndex={-1}>
        {/* Mientras se descarga una página con carga perezosa (React.lazy) se muestra este aviso */}
        <Suspense fallback={<p className={styles.pageLoading}>Cargando página...</p>}>
          <Outlet />
        </Suspense>
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
