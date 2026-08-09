use std::net::SocketAddr;

use anyhow::Context;
use embedded_labs_api::{build_app, content_dir_from_env};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .context("DATABASE_URL is required")?;
    let host = std::env::var("API_HOST").unwrap_or_else(|_| "0.0.0.0".into());
    let port: u16 = std::env::var("API_PORT")
        .unwrap_or_else(|_| "8080".into())
        .parse()
        .context("API_PORT must be a number")?;
    let cors_origin = std::env::var("CORS_ORIGIN").ok();
    let content_dir = content_dir_from_env();

    let app = build_app(&database_url, &content_dir, cors_origin).await?;
    let addr: SocketAddr = format!("{host}:{port}").parse()?;
    tracing::info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
