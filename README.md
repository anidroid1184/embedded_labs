# Embedded Labs

Laboratorio gráfico para aprender programación a bajo nivel: bits, máscaras y (más adelante) el camino hacia sistemas embebidos / kernel.

## Stack v0.1

- **Frontend:** Vite + React + TypeScript (`apps/web`)
- **Backend:** Rust (Axum + sqlx) (`apps/api`)
- **DB:** Postgres
- **Infra:** Docker Compose

## Arranque rápido

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:8080/health
- Postgres host: `localhost:15433`

## Desarrollo local

```bash
# Terminal 1 — DB
docker compose up -d postgres

# Terminal 2 — API
make api-dev

# Terminal 3 — Web
cd apps/web && pnpm install && pnpm dev
```

## Tests

```bash
# API (C01–C08)
make test-api

# Bit engine
cd apps/web && pnpm test

# E2E (API + web deben estar arriba, o usa webServer de Playwright + API en :8080)
cd apps/web && pnpm exec playwright install chromium
cd apps/web && pnpm e2e
```

## Añadir una lección nueva

1. Copia `content/lessons/lesson-02-stub.json` → `lesson-03-....json`
2. Cambia `id` (UUID), `slug`, `title`, `status`, `steps`
3. Para reseedar en vacío: `docker compose exec postgres psql -U embedded -d embedded_labs -c 'TRUNCATE lessons CASCADE;'` y reinicia la API
4. Kinds soportados: `bit_op`, `mask`, `quiz`, `placeholder`

## Fuera de alcance (v0.1)

- Sandbox Docker de asm/kernel
- Auth de usuarios
- WASM
