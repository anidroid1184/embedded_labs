import { describe, expect, it } from 'vitest'

import { normalizeLocale, pickI18n } from './locales'

describe('i18n helpers', () => {
  it('normalizes locale codes', () => {
    expect(normalizeLocale('es-CO')).toBe('es')
    expect(normalizeLocale('en-US')).toBe('en')
    expect(normalizeLocale(null)).toBe('en')
  })

  it('picks bilingual lesson fields by locale', () => {
    const title = { es: 'Fundamentos bitwise', en: 'Bitwise Basics' }
    expect(pickI18n(title, 'es')).toBe('Fundamentos bitwise')
    expect(pickI18n(title, 'en')).toBe('Bitwise Basics')
    expect(pickI18n('plain', 'en')).toBe('plain')
  })
})
