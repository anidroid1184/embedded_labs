import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { LessonPlayer } from '../components/LessonPlayer'
import { getLesson, type LessonDetail } from '../lib/api'

export function LessonPage() {
  const { slug = '' } = useParams()
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLesson(null)
    setError(null)
    getLesson(slug)
      .then((data) => {
        if (!cancelled) setLesson(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar la lección')
        }
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (error) {
    return (
      <div className="page-shell">
        <p className="error">{error}</p>
        <Link to="/">Volver</Link>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="page-shell">
        <p>Cargando lección…</p>
      </div>
    )
  }

  return (
    <div className="page-shell page-shell--wide">
      <Link className="back-link" to="/">
        ← Embedded Labs
      </Link>
      <LessonPlayer lesson={lesson} />
    </div>
  )
}
