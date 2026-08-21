import type { BitOperator } from './bit-engine'
import { pickI18n, type Locale } from '../i18n'

const GUEST_KEY = 'embedded_labs_guest_id'
const PROGRESS_KEY = 'embedded_labs_progress'

const staticMode =
  import.meta.env.VITE_STATIC_MODE === 'true' ||
  import.meta.env.VITE_STATIC_MODE === '1'

export type LessonStatus = 'published' | 'draft'
export type StepKind = 'bit_op' | 'mask' | 'quiz' | 'placeholder'

export type LessonSummary = {
  id: string
  slug: string
  title: string
  status: LessonStatus
  summary: string
}

export type LessonStep = {
  id: string
  kind: StepKind
  title: string
  narration: string
  visual: {
    bitWidth: number
    operator: BitOperator
    a: number
    b: number
    value?: number
    mask?: number
  }
}

export type LessonDetail = LessonSummary & {
  steps: LessonStep[]
}

export type ProgressItem = {
  lessonSlug: string
  stepId: string
  completed: boolean
}

export type ProgressResponse = {
  guestId: string
  items: ProgressItem[]
}

type Localized = string | Record<string, string>

type RawLesson = {
  id: string
  slug: string
  title: Localized
  status: LessonStatus
  summary: Localized
  steps: Array<{
    id: string
    kind: StepKind
    title: Localized
    narration: Localized
    visual: LessonStep['visual']
  }>
}

function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}${relativePath.replace(/^\//, '')}`
}

function getStoredGuestId(): string | null {
  return localStorage.getItem(GUEST_KEY)
}

function storeGuestId(guestId: string): void {
  localStorage.setItem(GUEST_KEY, guestId)
}

function ensureGuestId(): string {
  const existing = getStoredGuestId()
  if (existing) return existing
  const guestId = crypto.randomUUID()
  storeGuestId(guestId)
  return guestId
}

function readLocalProgress(): ProgressItem[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProgressItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalProgress(items: ProgressItem[]): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(items))
}

function resolveLesson(raw: RawLesson, locale: Locale): LessonDetail {
  return {
    id: raw.id,
    slug: raw.slug,
    status: raw.status,
    title: pickI18n(raw.title, locale),
    summary: pickI18n(raw.summary, locale),
    steps: raw.steps.map((step) => ({
      id: step.id,
      kind: step.kind,
      title: pickI18n(step.title, locale),
      narration: pickI18n(step.narration, locale),
      visual: step.visual,
    })),
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const guestId = getStoredGuestId()
  if (guestId) {
    headers.set('X-Guest-Id', guestId)
  }

  const response = await fetch(path, { ...init, headers })
  const issued = response.headers.get('X-Guest-Id')
  if (issued) {
    storeGuestId(issued)
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

async function listLessonsStatic(locale: Locale): Promise<LessonSummary[]> {
  const response = await fetch(assetUrl('lessons/manifest.json'))
  if (!response.ok) {
    throw new Error('Failed to load static lesson manifest')
  }
  const raw = (await response.json()) as Array<{
    id: string
    slug: string
    title: Localized
    status: LessonStatus
    summary: Localized
  }>
  return raw.map((item) => ({
    id: item.id,
    slug: item.slug,
    status: item.status,
    title: pickI18n(item.title, locale),
    summary: pickI18n(item.summary, locale),
  }))
}

async function getLessonStatic(slug: string, locale: Locale): Promise<LessonDetail> {
  const response = await fetch(assetUrl(`lessons/${encodeURIComponent(slug)}.json`))
  if (!response.ok) {
    throw new Error(`Lesson '${slug}' not found`)
  }
  const raw = (await response.json()) as RawLesson
  return resolveLesson(raw, locale)
}

export async function listLessons(locale: Locale): Promise<LessonSummary[]> {
  if (staticMode) {
    return listLessonsStatic(locale)
  }
  try {
    return await apiFetch(`/api/v1/lessons?locale=${encodeURIComponent(locale)}`)
  } catch {
    return listLessonsStatic(locale)
  }
}

export async function getLesson(slug: string, locale: Locale): Promise<LessonDetail> {
  if (staticMode) {
    return getLessonStatic(slug, locale)
  }
  try {
    return await apiFetch(
      `/api/v1/lessons/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`,
    )
  } catch {
    return getLessonStatic(slug, locale)
  }
}

export async function getProgress(): Promise<ProgressResponse> {
  if (staticMode) {
    return {
      guestId: ensureGuestId(),
      items: readLocalProgress(),
    }
  }
  try {
    return await apiFetch('/api/v1/progress')
  } catch {
    return {
      guestId: ensureGuestId(),
      items: readLocalProgress(),
    }
  }
}

export async function upsertProgress(input: {
  lessonSlug: string
  stepId: string
  completed: boolean
}): Promise<ProgressResponse> {
  if (staticMode) {
    const guestId = ensureGuestId()
    const items = readLocalProgress().filter(
      (item) =>
        !(item.lessonSlug === input.lessonSlug && item.stepId === input.stepId),
    )
    items.push({
      lessonSlug: input.lessonSlug,
      stepId: input.stepId,
      completed: input.completed,
    })
    writeLocalProgress(items)
    return { guestId, items }
  }

  try {
    return await apiFetch('/api/v1/progress', {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  } catch {
    const guestId = ensureGuestId()
    const items = readLocalProgress().filter(
      (item) =>
        !(item.lessonSlug === input.lessonSlug && item.stepId === input.stepId),
    )
    items.push({
      lessonSlug: input.lessonSlug,
      stepId: input.stepId,
      completed: input.completed,
    })
    writeLocalProgress(items)
    return { guestId, items }
  }
}

export function isStepCompleted(
  items: ProgressItem[],
  lessonSlug: string,
  stepId: string,
): boolean {
  return items.some(
    (item) =>
      item.lessonSlug === lessonSlug &&
      item.stepId === stepId &&
      item.completed,
  )
}
