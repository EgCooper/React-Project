import { Link } from 'react-router'
import PageTitle from '../components/PageTitle.tsx'

function NotFound() {
  return (
    <>
      <PageTitle title="Página no encontrada" />
      <h1>Página no encontrada</h1>
      <p>La dirección que abriste no existe en la biblioteca.</p>
      <Link to="/">Volver al catálogo</Link>
    </>
  )
}

export default NotFound
