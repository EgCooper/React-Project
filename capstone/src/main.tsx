import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import AuthProvider from './context/AuthProvider.tsx'
import LibraryProvider from './context/LibraryProvider.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter useTransitions={false}>
      <AuthProvider>
        {/* Dentro de AuthProvider: necesita saber quién inició sesión para cargar sus préstamos */}
        <LibraryProvider>
          <App />
        </LibraryProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
