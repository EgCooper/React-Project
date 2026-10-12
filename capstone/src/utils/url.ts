// Convierte ?pagina= en un entero >= 1; cualquier otro valor ('abc', '-5', '2.5') vuelve a la pagina 1
export function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

// Pagina a la que volver tras iniciar sesion. Solo rutas internas ("/..."), nunca otra web ("//sitio.com")
export function getRedirectPath(state: unknown): string {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'string' &&
    state.from.startsWith('/') &&
    !state.from.startsWith('//')
  ) {
    return state.from
  }

  return '/'
}
