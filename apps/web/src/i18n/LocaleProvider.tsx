import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  detectDefaultLocale,
  normalizeLocale,
  readStoredLocale,
  storeLocale,
  type Locale,
} from './locales'
import { en, type MessageKey } from './messages/en'
import { es } from './messages/es'

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  en,
  es,
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ''))
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    () => readStoredLocale() ?? detectDefaultLocale(),
  )

  const setLocale = useCallback((next: Locale) => {
    const normalized = normalizeLocale(next)
    storeLocale(normalized)
    setLocaleState(normalized)
  }, [])

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const catalog = catalogs[locale]
      return format(catalog[key] ?? en[key] ?? key, vars)
    },
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return ctx
}
