import { useEffect, useMemo, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import {
  getProgress,
  isStepCompleted,
  type LessonDetail,
  type ProgressItem,
  upsertProgress,
} from '../lib/api'
import { buildAnimation } from '../lib/bit-engine'
import { BitCanvas } from './BitCanvas'

type LessonPlayerProps = {
  lesson: LessonDetail
}

const PLAY_STEP_MS = 850

export function LessonPlayer({ lesson }: LessonPlayerProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [frameIndex, setFrameIndex] = useState(0)
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([])
  const [busy, setBusy] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const playTimer = useRef<number | null>(null)
  const reduceMotion = usePrefersReducedMotion()

  const step = lesson.steps[stepIndex]

  const animation = useMemo(() => {
    if (!step || step.kind === 'placeholder') {
      return null
    }
    return buildAnimation(step.visual)
  }, [step])

  useEffect(() => {
    setFrameIndex(0)
    setPlaying(false)
  }, [stepIndex])

  useEffect(() => {
    let cancelled = false
    getProgress()
      .then((res) => {
        if (!cancelled) {
          setProgressItems(res.items)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar progreso')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!playing || !animation) return

    if (frameIndex >= animation.frames.length - 1) {
      setPlaying(false)
      return
    }

    const delay = reduceMotion ? 0 : PLAY_STEP_MS
    playTimer.current = window.setTimeout(() => {
      setFrameIndex((current) =>
        Math.min(current + 1, animation.frames.length - 1),
      )
    }, delay)

    return () => {
      if (playTimer.current !== null) {
        window.clearTimeout(playTimer.current)
      }
    }
  }, [playing, frameIndex, animation, reduceMotion])

  if (!step) {
    return <p>Esta lección no tiene pasos.</p>
  }

  const completed = isStepCompleted(progressItems, lesson.slug, step.id)
  const isPlaceholder = step.kind === 'placeholder'
  const frame = animation?.frames[frameIndex]
  const frameCount = animation?.frames.length ?? 0

  async function markComplete() {
    setBusy(true)
    setError(null)
    try {
      const res = await upsertProgress({
        lessonSlug: lesson.slug,
        stepId: step.id,
        completed: true,
      })
      setProgressItems(res.items)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando progreso')
    } finally {
      setBusy(false)
    }
  }

  function nextFrame() {
    if (!animation) return
    setPlaying(false)
    setFrameIndex((current) => Math.min(current + 1, animation.frames.length - 1))
  }

  function resetFrame() {
    setPlaying(false)
    setFrameIndex(0)
  }

  function playAll() {
    if (!animation) return
    if (frameIndex >= animation.frames.length - 1) {
      setFrameIndex(0)
    }
    setPlaying(true)
  }

  return (
    <div className="player">
      <aside className="player__rail">
        <p className="eyebrow">
          {lesson.status === 'draft' ? 'Borrador' : 'Lección'}
        </p>
        <h1>{lesson.title}</h1>
        <p className="player__summary">{lesson.summary}</p>
        <ol className="step-list">
          {lesson.steps.map((item, index) => {
            const done = isStepCompleted(progressItems, lesson.slug, item.id)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`step-list__item${index === stepIndex ? ' is-active' : ''}${done ? ' is-done' : ''}`}
                  onClick={() => setStepIndex(index)}
                  data-testid={`step-nav-${item.id}`}
                >
                  <span>{item.title}</span>
                  {done ? <span className="badge">Hecho</span> : null}
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      <main className="player__stage">
        <header className="player__stage-header">
          <h2>{step.title}</h2>
          <p>{step.narration}</p>
          {completed ? (
            <p className="status-pill" data-testid="step-completed">
              Paso completado
            </p>
          ) : null}
        </header>

        {isPlaceholder ? (
          <section className="placeholder-panel" data-testid="placeholder-panel">
            <h3>Plantilla lista para editar</h3>
            <p>
              Sustituye el contenido en{' '}
              <code>content/lessons/lesson-02-stub.json</code> y reinicia la API
              (o vacía la tabla <code>lessons</code>) para reseedar.
            </p>
          </section>
        ) : frame && animation ? (
          <BitCanvas
            bitWidth={animation.bitWidth}
            frame={frame}
            frameIndex={frameIndex}
            frameCount={frameCount}
          />
        ) : null}

        {!isPlaceholder ? (
          <div className="controls">
            <button type="button" onClick={resetFrame} data-testid="btn-reset">
              Reset
            </button>
            <button type="button" onClick={nextFrame} data-testid="btn-step">
              Step
            </button>
            <button
              type="button"
              onClick={playAll}
              data-testid="btn-play"
              aria-pressed={playing}
              className={playing ? 'is-playing' : undefined}
            >
              {playing ? 'Playing…' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => void markComplete()}
              disabled={busy || completed}
              data-testid="btn-complete"
            >
              {completed ? 'Completado' : 'Marcar completo'}
            </button>
          </div>
        ) : (
          <div className="controls">
            <button
              type="button"
              onClick={() => void markComplete()}
              disabled={busy || completed}
              data-testid="btn-complete"
            >
              {completed ? 'Completado' : 'Marcar plantilla vista'}
            </button>
          </div>
        )}

        {error ? <p className="error">{error}</p> : null}

        <div className="player__nav">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => i - 1)}
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={stepIndex >= lesson.steps.length - 1}
            onClick={() => setStepIndex((i) => i + 1)}
          >
            Siguiente
          </button>
        </div>
      </main>
    </div>
  )
}
