use axum::{
    Json,
    extract::{Path, State},
};

use crate::error::AppError;
use crate::models::lesson::{LessonDetail, LessonRow, LessonStep, LessonStepRow, LessonSummary};
use crate::state::AppState;

pub async fn list_lessons(
    State(state): State<AppState>,
) -> Result<Json<Vec<LessonSummary>>, AppError> {
    let rows = sqlx::query_as::<_, LessonRow>(
        r#"
        SELECT id, slug, title, status, summary
        FROM lessons
        ORDER BY title ASC
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(rows.into_iter().map(LessonSummary::from).collect()))
}

pub async fn get_lesson(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<LessonDetail>, AppError> {
    let lesson = sqlx::query_as::<_, LessonRow>(
        r#"
        SELECT id, slug, title, status, summary
        FROM lessons
        WHERE slug = $1
        "#,
    )
    .bind(&slug)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("lesson '{slug}' not found")))?;

    let steps = sqlx::query_as::<_, LessonStepRow>(
        r#"
        SELECT id, lesson_id, position, kind, title, narration, visual
        FROM lesson_steps
        WHERE lesson_id = $1
        ORDER BY position ASC
        "#,
    )
    .bind(lesson.id)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(LessonDetail {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        status: lesson.status,
        summary: lesson.summary,
        steps: steps
            .into_iter()
            .map(|s| LessonStep {
                id: s.id,
                kind: s.kind,
                title: s.title,
                narration: s.narration,
                visual: s.visual,
            })
            .collect(),
    }))
}
