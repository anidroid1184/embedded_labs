use axum::{Json, extract::State, http::StatusCode};
use serde_json::{Value, json};

use crate::state::AppState;

pub async fn health() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

pub async fn ready(State(state): State<AppState>) -> Result<Json<Value>, StatusCode> {
    match sqlx::query("SELECT 1").execute(&state.pool).await {
        Ok(_) => Ok(Json(json!({ "status": "ready" }))),
        Err(_) => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}
