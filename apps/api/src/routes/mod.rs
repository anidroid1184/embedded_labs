pub mod health;
pub mod lessons;
pub mod progress;

use axum::{routing::get, Router};
use sqlx::PgPool;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::state::AppState;

pub fn app_router(pool: PgPool, cors_origin: Option<String>) -> Router {
    let state = AppState { pool };

    let cors = match cors_origin {
        Some(origin) if !origin.is_empty() && origin != "*" => {
            let parsed = origin
                .parse::<http::HeaderValue>()
                .expect("valid CORS_ORIGIN");
            CorsLayer::new()
                .allow_origin(parsed)
                .allow_methods(Any)
                .allow_headers(Any)
        }
        _ => CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any),
    };

    Router::new()
        .route("/health", get(health::health))
        .route("/ready", get(health::ready))
        .route("/api/v1/lessons", get(lessons::list_lessons))
        .route("/api/v1/lessons/{slug}", get(lessons::get_lesson))
        .route(
            "/api/v1/progress",
            get(progress::get_progress).put(progress::upsert_progress),
        )
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
