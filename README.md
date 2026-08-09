# Embedded Labs

**Side project open source** — laboratorio gráfico para aprender programación a bajo nivel: bits, máscaras, desplazamientos y (más adelante) el camino hacia sistemas embebidos / kernel.

> Prototipo iniciado con ayuda de IA (Cursor). El objetivo es aprender haciendo: infra real, frontend visual y contenido de lecciones que vas ampliando tú.

## Qué es

Una web altamente visual donde ves **cómo se transforman los bits** paso a paso (AND/OR/XOR/NOT, máscaras, SHL), con:

- Player gráfico + animaciones de desplazamiento
- API de lecciones/progreso
- Docker Compose para levantar todo en local
- Lección 1 completa como plantilla; Lección 2 stub para que metas mano

## Stack v0.1

| Capa | Tecnología |
|------|------------|
| Frontend | Vite + React + TypeScript (`apps/web`) |
| Backend | Rust — Axum + sqlx (`apps/api`) |
| DB | Postgres |
| Infra | Docker Compose |

## Arranque rápido

```bash
git clone https://github.com/anidroid1184/embedded_labs.git
cd embedded_labs
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:8080/health
- Postgres (host): `localhost:15433`

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
make test-api          # API (C01–C08)
cd apps/web && pnpm test
cd apps/web && pnpm exec playwright install chromium && pnpm e2e
```

## Añadir una lección

1. Copia `content/lessons/lesson-02-stub.json` → `lesson-03-....json`
2. Cambia `id` (UUID), `slug`, `title`, `status`, `steps`
3. Reinicia la API (el seed sincroniza JSON → DB al arrancar)
4. Kinds: `bit_op` · `mask` · `quiz` · `placeholder`

## Fuera de alcance (v0.1)

- Sandbox Docker de asm/kernel
- Auth de usuarios
- WASM

## Licencia

MIT — úsalo, forkearlo y aprender con él.

## Contribuir

Issues y PRs bienvenidos. Es un side project en construcción: prioriza claridad, tests y lecciones jugables.
