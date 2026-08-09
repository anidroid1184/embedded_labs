.PHONY: up down logs api-dev web-dev test test-api test-web

ifneq (,$(wildcard .env))
include .env
export
endif

up:
	@test -f .env || (echo "Missing .env — run: cp .env.example .env" && exit 1)
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

api-dev:
	@test -n "$(DATABASE_URL)" || (echo "Missing DATABASE_URL — copy .env.example to .env" && exit 1)
	cd apps/api && CONTENT_DIR=$${CONTENT_DIR:-../../content/lessons} \
		CORS_ORIGIN=$${CORS_ORIGIN:-http://localhost:5173} \
		cargo run

web-dev:
	cd apps/web && pnpm dev

test: test-api test-web

test-api:
	@test -n "$(DATABASE_URL)" || (echo "Missing DATABASE_URL — copy .env.example to .env" && exit 1)
	cd apps/api && CONTENT_DIR=$${CONTENT_DIR:-../../content/lessons} cargo test

test-web:
	cd apps/web && pnpm test
