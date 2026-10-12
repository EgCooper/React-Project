import { describe, expect, it } from 'vitest'
import { validateEmail, validateLogin, validatePassword, validateRegister } from './validation.ts'

describe('validateEmail', () => {
  it('pide el correo si está vacío o solo tiene espacios', () => {
    expect(validateEmail('')).toBe('Escribe tu correo.')
    expect(validateEmail('   ')).toBe('Escribe tu correo.')
  })

  it('rechaza correos sin formato algo@algo.algo', () => {
    expect(validateEmail('ana')).toBe('El correo no tiene un formato válido.')
    expect(validateEmail('ana@correo')).toBe('El correo no tiene un formato válido.')
    expect(validateEmail('ana @correo.com')).toBe('El correo no tiene un formato válido.')
  })

  it('acepta un correo válido aunque tenga espacios alrededor', () => {
    expect(validateEmail('ana@correo.com')).toBeNull()
    expect(validateEmail('  ana@correo.com  ')).toBeNull()
  })
})

describe('validatePassword', () => {
  // it.each: la misma prueba con varios datos; %s se reemplaza por el primer valor de cada fila
  it.each([
    ['Ab1', 'La contraseña debe tener al menos 8 caracteres.'],
    ['ABCDEFG1', 'La contraseña debe incluir una letra minúscula.'],
    ['abcdefg1', 'La contraseña debe incluir una letra mayúscula.'],
    ['Abcdefgh', 'La contraseña debe incluir un número.'],
  ])('rechaza "%s"', (password, message) => {
    expect(validatePassword(password)).toBe(message)
  })

  it('acepta 8 caracteres con minúscula, mayúscula y número', () => {
    expect(validatePassword('Abcdefg1')).toBeNull()
  })
})

describe('validateRegister', () => {
  it('no devuelve errores con datos válidos', () => {
    expect(validateRegister({ email: 'ana@correo.com', password: 'Abcdefg1', confirmPassword: 'Abcdefg1' })).toEqual({})
  })

  it('marca las contraseñas que no coinciden', () => {
    const errors = validateRegister({ email: 'ana@correo.com', password: 'Abcdefg1', confirmPassword: 'Abcdefg2' })
    expect(errors).toEqual({ confirmPassword: 'Las contraseñas no coinciden.' })
  })

  it('devuelve todos los errores a la vez', () => {
    const errors = validateRegister({ email: '', password: 'abc', confirmPassword: '' })
    expect(Object.keys(errors)).toEqual(['email', 'password', 'confirmPassword'])
  })
})

describe('validateLogin', () => {
  it('solo exige que haya contraseña, sin reglas de formato', () => {
    expect(validateLogin({ email: 'ana@correo.com', password: 'x' })).toEqual({})
    expect(validateLogin({ email: 'ana@correo.com', password: '' })).toEqual({ password: 'Escribe tu contraseña.' })
  })
})
