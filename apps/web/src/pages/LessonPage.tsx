import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { LanguageToggle } from '../components/LanguageToggle'
import { LessonPlayer } from '../components/LessonPlayer'
import { useLocale } from '../i18n'
import { getLesson, type LessonDetail } from '../lib/api'

export function LessonPage() {
  const { slug = '' } = useParams()
  const { locale, t } = useLocale()
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLesson(null)
    setError(null)
    getLesson(slug, locale)
      .then((data) => {
        if (!cancelled) setLesson(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('lesson.loadError'))
        }
      })
    return () => {
      cancelled = true
    }
  }, [slug, locale, t])

  if (error) {
    return (
      <div className="page-shell">
        <div className="top-bar">
          <LanguageToggle />
        </div>
        <p className="error">{error}</p>
        <Link to="/">{t('lesson.back')}</Link>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="page-shell">
        <div className="top-bar">
          <LanguageToggle />
        </div>
        <p>{t('lesson.loading')}</p>
      </div>
    )
  }

  return (
    <div className="page-shell page-shell--wide">
      <div className="top-bar top-bar--spread">
        <Link className="back-link" to="/">
          {t('lesson.back')}
        </Link>
        <LanguageToggle />
      </div>
      <LessonPlayer lesson={lesson} />
    </div>
  )
}
