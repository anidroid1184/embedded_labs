.PHONY: up down logs api-dev web-dev test test-api test-web seed

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

api-dev:
	cd apps/api && DATABASE_URL=$${DATABASE_URL:-postgres://embedded:embedded@localhost:15433/embedded_labs} \
		CONTENT_DIR=../../content/lessons \
		CORS_ORIGIN=http://localhost:5173 \
		cargo run

web-dev:
	cd apps/web && pnpm dev

test: test-api test-web

test-api:
	cd apps/api && DATABASE_URL=$${DATABASE_URL:-postgres://embedded:embedded@localhost:15433/embedded_labs} \
		CONTENT_DIR=../../content/lessons \
		cargo test

test-web:
	cd apps/web && pnpm test
