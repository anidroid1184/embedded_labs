import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { HeroBits } from '../components/HeroBits'
import { LanguageToggle } from '../components/LanguageToggle'
import { useLocale } from '../i18n'
import { listLessons, type LessonSummary } from '../lib/api'

export function HomePage() {
  const { locale, t } = useLocale()
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listLessons(locale)
      .then(setLessons)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : t('home.loadingError'))
      })
  }, [locale, t])

  return (
    <div className="home">
      <div className="top-bar">
        <LanguageToggle />
      </div>
      <section className="home__hero">
        <div className="home__hero-copy">
          <p className="brand">{t('brand.name')}</p>
          <h1>{t('home.headline')}</h1>
          <p className="lede">{t('home.lede')}</p>
          <div className="home__actions">
            <Link className="btn btn--primary" to="/lessons/bitwise-basics">
              {t('home.cta.lesson1')}
            </Link>
            <Link className="btn btn--ghost" to="/lessons/registers-and-memory">
              {t('home.cta.lesson2')}
            </Link>
            <Link className="btn btn--ghost" to="/lessons/test">
              {t('home.cta.lesson3')}
            </Link>
          </div>
        </div>
        <HeroBits />
      </section>

      <section className="home__catalog">
        <div className="home__catalog-head">
          <h2>{t('home.catalog')}</h2>
          <p>{t('home.catalog.sub')}</p>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <ul className="lesson-grid">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link to={`/lessons/${lesson.slug}`} className="lesson-card-link">
                <article>
                  <p className="eyebrow">
                    {lesson.status === 'draft'
                      ? t('status.draft')
                      : t('status.published')}
                  </p>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.summary}</p>
                  <span className="lesson-card-link__cta">{t('lesson.open')}</span>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
