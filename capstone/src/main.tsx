import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// importamos libreria para manejar rutas
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
