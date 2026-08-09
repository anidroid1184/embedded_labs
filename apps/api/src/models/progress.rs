use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProgressRow {
    pub guest_id: Uuid,
    pub lesson_id: Uuid,
    pub step_id: String,
    pub completed: bool,
    pub lesson_slug: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressItem {
    pub lesson_slug: String,
    pub step_id: String,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressResponse {
    pub guest_id: Uuid,
    pub items: Vec<ProgressItem>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertProgressRequest {
    pub lesson_slug: String,
    pub step_id: String,
    pub completed: bool,
}
