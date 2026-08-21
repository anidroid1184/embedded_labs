<!-- Generated: 2026-08-21 12:00:00 UTC -->

# Project overview — Embedded Labs

## Purpose

Web app to learn low-level programming visually. v0.2 delivers a bilingual bitwise lesson player, FastAPI lessons/progress API, and Docker Compose infrastructure.

## Key paths

| Path | Role |
|---|---|
| `apps/web` | React lesson player + bit-engine + i18n |
| `apps/api` | FastAPI API, SQLAlchemy models, seed |
| `content/lessons` | Bilingual lesson JSON source of truth |
| `docker-compose.yml` | postgres + api + web |
| `docs/project-overview.md` | This file |

## Runtime flow

1. API boots → creates schema → seeds lessons from JSON
2. Web loads lesson list from `/api/v1/lessons?locale=`
3. Locale toggle persists in `localStorage` (`embedded_labs_locale`)
4. Player runs bit animations client-side
5. Progress stored per guest UUID (`X-Guest-Id` + `localStorage` on Pages)

## Deferred

- Docker sandbox for asm/kernel
- Real user accounts
- Lesson WYSIWYG editor
