import { Link } from 'react-router'
import PageTitle from '../../components/PageTitle/PageTitle.tsx'

function NotFound() {
  return (
    <>
      <PageTitle title="Page not found" />
      <h1>Page not found</h1>
      <p>The address you opened doesn’t exist in the library.</p>
      <Link to="/">Back to catalog</Link>
    </>
  )
}

export default NotFound
