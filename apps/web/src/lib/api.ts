import type { BitOperator } from './bit-engine'

const GUEST_KEY = 'embedded_labs_guest_id'

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

function getStoredGuestId(): string | null {
  return localStorage.getItem(GUEST_KEY)
}

function storeGuestId(guestId: string): void {
  localStorage.setItem(GUEST_KEY, guestId)
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

export function listLessons(): Promise<LessonSummary[]> {
  return apiFetch('/api/v1/lessons')
}

export function getLesson(slug: string): Promise<LessonDetail> {
  return apiFetch(`/api/v1/lessons/${encodeURIComponent(slug)}`)
}

export function getProgress(): Promise<ProgressResponse> {
  return apiFetch('/api/v1/progress')
}

export function upsertProgress(input: {
  lessonSlug: string
  stepId: string
  completed: boolean
}): Promise<ProgressResponse> {
  return apiFetch('/api/v1/progress', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
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
