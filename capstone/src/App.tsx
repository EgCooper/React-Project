import { Route, Routes } from 'react-router'
import Layout from './components/Layout.tsx'
import Home from './pages/Home.tsx'
import BookDetail from './pages/BookDetail.tsx'
import MyLoans from './pages/MyLoans.tsx'
import NotFound from './pages/NotFound.tsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="libro/:id" element={<BookDetail />} />
        <Route path="mis-prestamos" element={<MyLoans />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
