use std::path::Path;

use anyhow::{Context, Result};
use sqlx::PgPool;
use tracing::{info, warn};

use crate::models::lesson::LessonFile;

pub async fn seed_lessons_if_empty(pool: &PgPool, content_dir: &Path) -> Result<()> {
    // Always sync JSON → DB so content edits (e.g. new SHL step) apply on restart.
    seed_lessons(pool, content_dir).await
}

async fn seed_lessons(pool: &PgPool, content_dir: &Path) -> Result<()> {
    if !content_dir.exists() {
        warn!("content dir missing: {}", content_dir.display());
        return Ok(());
    }

    let mut entries: Vec<_> = std::fs::read_dir(content_dir)
        .with_context(|| format!("read content dir {}", content_dir.display()))?
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path()
                .extension()
                .and_then(|x| x.to_str())
                .is_some_and(|ext| ext.eq_ignore_ascii_case("json"))
        })
        .collect();
    entries.sort_by_key(|e| e.file_name());

    for entry in entries {
        let path = entry.path();
        let raw = std::fs::read_to_string(&path)
            .with_context(|| format!("read lesson file {}", path.display()))?;
        let lesson: LessonFile = serde_json::from_str(&raw)
            .with_context(|| format!("parse lesson file {}", path.display()))?;
        upsert_lesson(pool, &lesson).await?;
        info!("synced lesson slug={}", lesson.slug);
    }

    Ok(())
}

async fn upsert_lesson(pool: &PgPool, lesson: &LessonFile) -> Result<()> {
    let mut tx = pool.begin().await?;

    sqlx::query(
        r#"
        INSERT INTO lessons (id, slug, title, status, summary)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
            slug = EXCLUDED.slug,
            title = EXCLUDED.title,
            status = EXCLUDED.status,
            summary = EXCLUDED.summary,
            updated_at = NOW()
        "#,
    )
    .bind(lesson.id)
    .bind(&lesson.slug)
    .bind(&lesson.title)
    .bind(&lesson.status)
    .bind(&lesson.summary)
    .execute(&mut *tx)
    .await?;

    sqlx::query("DELETE FROM lesson_steps WHERE lesson_id = $1")
        .bind(lesson.id)
        .execute(&mut *tx)
        .await?;

    for (position, step) in lesson.steps.iter().enumerate() {
        sqlx::query(
            r#"
            INSERT INTO lesson_steps (id, lesson_id, position, kind, title, narration, visual)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
        )
        .bind(&step.id)
        .bind(lesson.id)
        .bind(position as i32)
        .bind(&step.kind)
        .bind(&step.title)
        .bind(&step.narration)
        .bind(&step.visual)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}
