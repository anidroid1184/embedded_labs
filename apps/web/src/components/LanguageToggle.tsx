import { useLocale } from '../i18n'

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale()

  return (
    <div className="lang-toggle" role="group" aria-label={t('lang.switch')}>
      <button
        type="button"
        className={locale === 'es' ? 'is-active' : undefined}
        aria-pressed={locale === 'es'}
        data-testid="lang-es"
        onClick={() => setLocale('es')}
      >
        {t('lang.es')}
      </button>
      <button
        type="button"
        className={locale === 'en' ? 'is-active' : undefined}
        aria-pressed={locale === 'en'}
        data-testid="lang-en"
        onClick={() => setLocale('en')}
      >
        {t('lang.en')}
      </button>
    </div>
  )
}
