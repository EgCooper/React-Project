import { lazy } from 'react'
import { Route, Routes } from 'react-router'
import Layout from './components/Layout.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import Home from './pages/Home.tsx'

// Carga perezosa: cada página se descarga recién la primera vez que se visita.
// El catálogo no, porque es la portada y se necesita de inmediato
const BookDetail = lazy(() => import('./pages/BookDetail.tsx'))
const MyLoans = lazy(() => import('./pages/MyLoans.tsx'))
const MyBooks = lazy(() => import('./pages/MyBooks.tsx'))
const Login = lazy(() => import('./pages/Login.tsx'))
const Register = lazy(() => import('./pages/Register.tsx'))
const NotFound = lazy(() => import('./pages/NotFound.tsx'))

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="libro/:id" element={<BookDetail />} />
        {/* Rutas privadas: solo se muestran con sesion iniciada */}
        <Route element={<ProtectedRoute />}>
          <Route path="mis-prestamos" element={<MyLoans />} />
          <Route path="mis-libros" element={<MyBooks />} />
        </Route>
        <Route path="registro" element={<Register />} />
        <Route path="iniciar-sesion" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
