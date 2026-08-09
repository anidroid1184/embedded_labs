use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LessonRow {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub status: String,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LessonStepRow {
    pub id: String,
    pub lesson_id: Uuid,
    pub position: i32,
    pub kind: String,
    pub title: String,
    pub narration: String,
    pub visual: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LessonSummary {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub status: String,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LessonStep {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub narration: String,
    pub visual: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LessonDetail {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub status: String,
    pub summary: String,
    pub steps: Vec<LessonStep>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LessonFile {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub status: String,
    pub summary: String,
    pub steps: Vec<LessonFileStep>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LessonFileStep {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub narration: String,
    pub visual: Value,
}

impl From<LessonRow> for LessonSummary {
    fn from(row: LessonRow) -> Self {
        Self {
            id: row.id,
            slug: row.slug,
            title: row.title,
            status: row.status,
            summary: row.summary,
        }
    }
}
