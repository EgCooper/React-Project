import { describe, expect, it } from 'vitest'
import { formatDate, isOverdue } from '../../src/utils/date.ts'

describe('formatDate', () => {
  it('muestra la fecha en español', () => {
    // Mediodía UTC: el día no cambia en ninguna zona horaria de América
    expect(formatDate('2026-10-27T12:00:00Z')).toBe('27 de octubre de 2026')
  })
})

describe('isOverdue', () => {
  const now = new Date('2026-10-20T12:00:00Z')

  it('está vencido si la fecha límite ya pasó', () => {
    expect(isOverdue('2026-10-19T12:00:00Z', now)).toBe(true)
  })

  it('no está vencido si la fecha límite es posterior', () => {
    expect(isOverdue('2026-10-21T12:00:00Z', now)).toBe(false)
  })
})
