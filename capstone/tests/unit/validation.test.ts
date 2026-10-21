import { describe, expect, it } from 'vitest'
import { validateEmail, validateLogin, validatePassword, validateRegister } from '../../src/utils/validation.ts'

describe('validateEmail', () => {
  it('pide el correo si está vacío o solo tiene espacios', () => {
    expect(validateEmail('')).toBe('Enter your email.')
    expect(validateEmail('   ')).toBe('Enter your email.')
  })

  it('rechaza correos sin formato algo@algo.algo', () => {
    expect(validateEmail('ana')).toBe('Enter a valid email address.')
    expect(validateEmail('ana@correo')).toBe('Enter a valid email address.')
    expect(validateEmail('ana @correo.com')).toBe('Enter a valid email address.')
  })

  it('acepta un correo válido aunque tenga espacios alrededor', () => {
    expect(validateEmail('ana@correo.com')).toBeNull()
    expect(validateEmail('  ana@correo.com  ')).toBeNull()
  })
})

describe('validatePassword', () => {
  // it.each: la misma prueba con varios datos; %s se reemplaza por el primer valor de cada fila
  it.each([
    ['Ab1', 'Password must be at least 8 characters long.'],
    ['ABCDEFG1', 'Password must include a lowercase letter.'],
    ['abcdefg1', 'Password must include an uppercase letter.'],
    ['Abcdefgh', 'Password must include a number.'],
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
    expect(errors).toEqual({ confirmPassword: 'Passwords do not match.' })
  })

  it('devuelve todos los errores a la vez', () => {
    const errors = validateRegister({ email: '', password: 'abc', confirmPassword: '' })
    expect(Object.keys(errors)).toEqual(['email', 'password', 'confirmPassword'])
  })
})

describe('validateLogin', () => {
  it('solo exige que haya contraseña, sin reglas de formato', () => {
    expect(validateLogin({ email: 'ana@correo.com', password: 'x' })).toEqual({})
    expect(validateLogin({ email: 'ana@correo.com', password: '' })).toEqual({ password: 'Enter your password.' })
  })
})
