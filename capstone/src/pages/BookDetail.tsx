import { useParams } from 'react-router'

function BookDetail() {
  const { id } = useParams()

  return <h1>Detalle del libro {id}</h1>
}

export default BookDetail
