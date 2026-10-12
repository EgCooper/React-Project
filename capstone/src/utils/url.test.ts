import { describe, expect, it } from 'vitest'
import { getRedirectPath, parsePage } from './url.ts'

describe('parsePage', () => {
  it('convierte ?pagina= válido en número', () => {
    expect(parsePage('3')).toBe(3)
  })

  // La URL la puede editar cualquiera: todo lo que no sea un entero >= 1 vuelve a la página 1
  it.each([null, '', 'abc', '0', '-5', '2.5'])('"%s" vuelve a la página 1', (value) => {
    expect(parsePage(value)).toBe(1)
  })
})

describe('getRedirectPath', () => {
  it('vuelve a la página interna de origen', () => {
    expect(getRedirectPath({ from: '/mis-prestamos' })).toBe('/mis-prestamos')
    expect(getRedirectPath({ from: '/?q=borges&pagina=2' })).toBe('/?q=borges&pagina=2')
  })

  // Evita "open redirect": nunca mandar al usuario a otra web después de iniciar sesión
  it.each([
    ['otra web con //', { from: '//sitio-malicioso.com' }],
    ['otra web con https', { from: 'https://sitio-malicioso.com' }],
    ['from que no es texto', { from: 123 }],
    ['sin state', null],
    ['state que no es objeto', 'texto'],
  ])('%s → "/"', (_case, state) => {
    expect(getRedirectPath(state)).toBe('/')
  })
})
