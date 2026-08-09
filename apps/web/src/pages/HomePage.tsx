import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { HeroBits } from '../components/HeroBits'
import { listLessons, type LessonSummary } from '../lib/api'

export function HomePage() {
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listLessons()
      .then(setLessons)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error cargando lecciones')
      })
  }, [])

  return (
    <div className="home">
      <section className="home__hero">
        <div className="home__hero-copy">
          <p className="brand">Embedded Labs</p>
          <h1>Ve cómo se mueven los bits</h1>
          <p className="lede">
            Laboratorio visual de bajo nivel: máscaras, AND/OR/XOR y desplazamientos
            paso a paso — identidad de terminal, animación de registro en vivo.
          </p>
          <div className="home__actions">
            <Link className="btn btn--primary" to="/lessons/bitwise-basics">
              Empezar Lección 1
            </Link>
            <Link className="btn btn--ghost" to="/lessons/registers-and-memory">
              Ver plantilla Lección 2
            </Link>
          </div>
        </div>
        <HeroBits />
      </section>

      <section className="home__catalog">
        <div className="home__catalog-head">
          <h2>Lecciones</h2>
          <p>Bloques sólidos. Sin humo: cada bit cuenta.</p>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <ul className="lesson-grid">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link to={`/lessons/${lesson.slug}`} className="lesson-card-link">
                <article>
                  <p className="eyebrow">
                    {lesson.status === 'draft' ? 'Draft / plantilla' : 'Published'}
                  </p>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.summary}</p>
                  <span className="lesson-card-link__cta">Abrir lab →</span>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
