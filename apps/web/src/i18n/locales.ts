export type Locale = 'es' | 'en'

export const LOCALE_STORAGE_KEY = 'embedded_labs_locale'

export function detectDefaultLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (value && value.toLowerCase().startsWith('es')) return 'es'
  return 'en'
}

export function readStoredLocale(): Locale | null {
  if (typeof localStorage === 'undefined') return null
  return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
}

export function storeLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

export function pickI18n(
  value: string | Record<string, string> | undefined,
  locale: Locale,
): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (value[locale]) return value[locale]
  if (value.en) return value.en
  if (value.es) return value.es
  return ''
}
