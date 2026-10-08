import { NavLink, Outlet } from 'react-router'

function Layout() {
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
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default Layout
