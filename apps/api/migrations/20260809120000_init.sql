CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('published', 'draft')),
    summary TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_steps (
    id TEXT NOT NULL,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    position INT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    narration TEXT NOT NULL,
    visual JSONB NOT NULL,
    PRIMARY KEY (lesson_id, id)
);

CREATE TABLE IF NOT EXISTS progress (
    guest_id UUID NOT NULL,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    step_id TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (guest_id, lesson_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_guest ON progress (guest_id);
CREATE INDEX IF NOT EXISTS idx_lesson_steps_lesson ON lesson_steps (lesson_id, position);
