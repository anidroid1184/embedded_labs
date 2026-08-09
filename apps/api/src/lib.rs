pub mod error;
pub mod models;
pub mod routes;
pub mod services;
pub mod state;

use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use sqlx::postgres::PgPoolOptions;
use tracing::info;

use crate::services::seed::seed_lessons_if_empty;

pub async fn build_app(
    database_url: &str,
    content_dir: &Path,
    cors_origin: Option<String>,
) -> Result<axum::Router> {
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await
        .context("connect postgres")?;

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .context("run migrations")?;

    seed_lessons_if_empty(&pool, content_dir).await?;

    info!("api ready");
    Ok(routes::app_router(pool, cors_origin))
}

pub fn content_dir_from_env() -> PathBuf {
    std::env::var("CONTENT_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("../../content/lessons"))
}
