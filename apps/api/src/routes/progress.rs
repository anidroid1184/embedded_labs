use axum::{
    Json,
    extract::State,
    http::{HeaderMap, HeaderName, HeaderValue, StatusCode, header},
    response::IntoResponse,
};
use uuid::Uuid;

use crate::error::AppError;
use crate::models::progress::{ProgressItem, ProgressResponse, ProgressRow, UpsertProgressRequest};
use crate::state::AppState;

const GUEST_HEADER: &str = "x-guest-id";

fn parse_guest_id(headers: &HeaderMap) -> Option<Uuid> {
    headers
        .get(GUEST_HEADER)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| Uuid::parse_str(s).ok())
}

fn guest_headers(guest_id: Uuid) -> HeaderMap {
    let mut headers = HeaderMap::new();
    let value = HeaderValue::from_str(&guest_id.to_string()).expect("uuid is valid header");
    headers.insert(HeaderName::from_static(GUEST_HEADER), value.clone());
    headers.insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&format!(
            "guest_id={guest_id}; Path=/; SameSite=Lax; Max-Age=31536000"
        ))
        .expect("cookie header"),
    );
    headers
}

async fn load_progress(pool: &sqlx::PgPool, guest_id: Uuid) -> Result<Vec<ProgressItem>, AppError> {
    let rows = sqlx::query_as::<_, ProgressRow>(
        r#"
        SELECT p.guest_id, p.lesson_id, p.step_id, p.completed, l.slug AS lesson_slug
        FROM progress p
        JOIN lessons l ON l.id = p.lesson_id
        WHERE p.guest_id = $1
        ORDER BY l.slug, p.step_id
        "#,
    )
    .bind(guest_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| ProgressItem {
            lesson_slug: r.lesson_slug,
            step_id: r.step_id,
            completed: r.completed,
        })
        .collect())
}

pub async fn get_progress(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let (guest_id, issued) = match parse_guest_id(&headers) {
        Some(id) => (id, false),
        None => (Uuid::new_v4(), true),
    };

    let items = if issued {
        Vec::new()
    } else {
        load_progress(&state.pool, guest_id).await?
    };

    let body = ProgressResponse { guest_id, items };
    let mut response = (StatusCode::OK, Json(body)).into_response();
    merge_guest_headers(response.headers_mut(), guest_id, issued);
    Ok(response)
}

pub async fn upsert_progress(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpsertProgressRequest>,
) -> Result<impl IntoResponse, AppError> {
    if payload.lesson_slug.trim().is_empty() || payload.step_id.trim().is_empty() {
        return Err(AppError::BadRequest(
            "lessonSlug and stepId are required".into(),
        ));
    }

    let (guest_id, issued) = match parse_guest_id(&headers) {
        Some(id) => (id, false),
        None => (Uuid::new_v4(), true),
    };

    let lesson_id: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM lessons WHERE slug = $1")
        .bind(&payload.lesson_slug)
        .fetch_optional(&state.pool)
        .await?;

    let Some((lesson_id,)) = lesson_id else {
        return Err(AppError::NotFound(format!(
            "lesson '{}' not found",
            payload.lesson_slug
        )));
    };

    let step_exists: Option<(String,)> = sqlx::query_as(
        "SELECT id FROM lesson_steps WHERE lesson_id = $1 AND id = $2",
    )
    .bind(lesson_id)
    .bind(&payload.step_id)
    .fetch_optional(&state.pool)
    .await?;

    if step_exists.is_none() {
        return Err(AppError::NotFound(format!(
            "step '{}' not found in lesson '{}'",
            payload.step_id, payload.lesson_slug
        )));
    }

    sqlx::query(
        r#"
        INSERT INTO progress (guest_id, lesson_id, step_id, completed, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (guest_id, lesson_id, step_id)
        DO UPDATE SET completed = EXCLUDED.completed, updated_at = NOW()
        "#,
    )
    .bind(guest_id)
    .bind(lesson_id)
    .bind(&payload.step_id)
    .bind(payload.completed)
    .execute(&state.pool)
    .await?;

    let items = load_progress(&state.pool, guest_id).await?;
    let body = ProgressResponse { guest_id, items };
    let mut response = (StatusCode::OK, Json(body)).into_response();
    merge_guest_headers(response.headers_mut(), guest_id, issued);
    Ok(response)
}

fn merge_guest_headers(headers: &mut HeaderMap, guest_id: Uuid, issued: bool) {
    if issued {
        for (key, value) in guest_headers(guest_id).iter() {
            headers.insert(key.clone(), value.clone());
        }
    } else {
        headers.insert(
            HeaderName::from_static(GUEST_HEADER),
            HeaderValue::from_str(&guest_id.to_string()).expect("uuid"),
        );
    }
}
