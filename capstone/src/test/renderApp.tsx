import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import App from '../App.tsx'
import AuthProvider from '../context/AuthProvider.tsx'

// La app completa (rutas, Layout, AuthProvider) igual que en main.tsx, pero con un router en memoria
// que empieza en `path`: así cada prueba puede abrir cualquier página sin un navegador real
export function renderApp(path = '/') {
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={[path]} useTransitions={false}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )

  return { user }
}
