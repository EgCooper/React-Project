import { Route, Routes } from 'react-router'
import Layout from './components/Layout.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import Home from './pages/Home.tsx'
import BookDetail from './pages/BookDetail.tsx'
import MyLoans from './pages/MyLoans.tsx'
import Login from './pages/Login.tsx'
import NotFound from './pages/NotFound.tsx'
import Register from './pages/Register.tsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="libro/:id" element={<BookDetail />} />
        {/* Rutas privadas: solo se muestran con sesion iniciada */}
        <Route element={<ProtectedRoute />}>
          <Route path="mis-prestamos" element={<MyLoans />} />
        </Route>
        <Route path="registro" element={<Register />} />
        <Route path="iniciar-sesion" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
