import { useEffect, useMemo, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useLocale } from '../i18n'
import type { MessageKey } from '../i18n/messages/en'
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
  const { t } = useLocale()
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
    return buildAnimation(step.visual, (key, vars) =>
      t(key as MessageKey, vars),
    )
  }, [step, t])

  useEffect(() => {
    setFrameIndex(0)
    setPlaying(false)
  }, [stepIndex, lesson.slug])

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
          setError(err instanceof Error ? err.message : 'progress error')
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
    return <p>{t('lesson.empty')}</p>
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
      setError(err instanceof Error ? err.message : 'Error')
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
          {lesson.status === 'draft' ? t('player.draft') : t('player.lesson')}
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
                  {done ? <span className="badge">{t('player.done')}</span> : null}
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
              {t('player.completed')}
            </p>
          ) : null}
        </header>

        {isPlaceholder ? (
          <section className="placeholder-panel" data-testid="placeholder-panel">
            <h3>{t('player.placeholder.title')}</h3>
            <p>{t('player.placeholder.body')}</p>
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
              {t('player.reset')}
            </button>
            <button type="button" onClick={nextFrame} data-testid="btn-step">
              {t('player.step')}
            </button>
            <button
              type="button"
              onClick={playAll}
              data-testid="btn-play"
              aria-pressed={playing}
              className={playing ? 'is-playing' : undefined}
            >
              {playing ? t('player.playing') : t('player.play')}
            </button>
            <button
              type="button"
              onClick={() => void markComplete()}
              disabled={busy || completed}
              data-testid="btn-complete"
            >
              {completed ? t('player.completedBtn') : t('player.complete')}
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
              {completed ? t('player.completedBtn') : t('player.markTemplate')}
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
            {t('player.prev')}
          </button>
          <button
            type="button"
            disabled={stepIndex >= lesson.steps.length - 1}
            onClick={() => setStepIndex((i) => i + 1)}
          >
            {t('player.next')}
          </button>
        </div>
      </main>
    </div>
  )
}
