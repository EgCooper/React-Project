import { Link } from 'react-router'

function NotFound() {
  return (
    <>
      <h1>Página no encontrada</h1>
      <Link to="/">Volver al catálogo</Link>
    </>
  )
}

export default NotFound
