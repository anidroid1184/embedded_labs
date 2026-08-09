use std::path::PathBuf;
use std::time::Duration;

use serde_json::Value;
use uuid::Uuid;

fn database_url() -> String {
    std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| {
            // Local test fallback only — real runs should set DATABASE_URL from .env
            "postgres://embedded:changeme@localhost:15433/embedded_labs".into()
        })
}

fn content_dir() -> PathBuf {
    std::env::var("CONTENT_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../content/lessons")
        })
}

async fn spawn_app() -> (String, reqwest::Client) {
    let app = embedded_labs_api::build_app(&database_url(), &content_dir(), Some("*".into()))
        .await
        .expect("build app");

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("bind");
    let addr = listener.local_addr().expect("addr");
    tokio::spawn(async move {
        axum::serve(listener, app).await.expect("serve");
    });

    // tiny wait for accept loop
    tokio::time::sleep(Duration::from_millis(50)).await;

    let base = format!("http://{addr}");
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .expect("client");
    (base, client)
}

#[tokio::test]
async fn c01_health_ok() {
    let (base, client) = spawn_app().await;
    let res = client.get(format!("{base}/health")).send().await.unwrap();
    assert_eq!(res.status(), 200);
    let body: Value = res.json().await.unwrap();
    assert_eq!(body["status"], "ok");
}

#[tokio::test]
async fn c02_ready_ok_with_postgres() {
    let (base, client) = spawn_app().await;
    let res = client.get(format!("{base}/ready")).send().await.unwrap();
    assert_eq!(res.status(), 200);
    let body: Value = res.json().await.unwrap();
    assert_eq!(body["status"], "ready");
}

#[tokio::test]
async fn c03_list_lessons_includes_l1_and_l2() {
    let (base, client) = spawn_app().await;
    let res = client
        .get(format!("{base}/api/v1/lessons"))
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 200);
    let body: Value = res.json().await.unwrap();
    let slugs: Vec<&str> = body
        .as_array()
        .unwrap()
        .iter()
        .map(|l| l["slug"].as_str().unwrap())
        .collect();
    assert!(slugs.contains(&"bitwise-basics"));
    assert!(slugs.contains(&"registers-and-memory"));

    let l1 = body
        .as_array()
        .unwrap()
        .iter()
        .find(|l| l["slug"] == "bitwise-basics")
        .unwrap();
    let l2 = body
        .as_array()
        .unwrap()
        .iter()
        .find(|l| l["slug"] == "registers-and-memory")
        .unwrap();
    assert_eq!(l1["status"], "published");
    assert_eq!(l2["status"], "draft");
}

#[tokio::test]
async fn c04_l1_detail_has_bitwise_steps() {
    let (base, client) = spawn_app().await;
    let res = client
        .get(format!("{base}/api/v1/lessons/bitwise-basics"))
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 200);
    let body: Value = res.json().await.unwrap();
    let steps = body["steps"].as_array().unwrap();
    assert!(steps.len() >= 5);
    let kinds: Vec<&str> = steps
        .iter()
        .map(|s| s["kind"].as_str().unwrap())
        .collect();
    assert!(kinds.contains(&"bit_op"));
    assert!(kinds.contains(&"mask"));
}

#[tokio::test]
async fn c05_l2_detail_has_placeholder() {
    let (base, client) = spawn_app().await;
    let res = client
        .get(format!("{base}/api/v1/lessons/registers-and-memory"))
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 200);
    let body: Value = res.json().await.unwrap();
    assert_eq!(body["status"], "draft");
    let steps = body["steps"].as_array().unwrap();
    assert_eq!(steps[0]["kind"], "placeholder");
}

#[tokio::test]
async fn c06_c07_c08_progress_action_and_persistence() {
    let (base, client) = spawn_app().await;

    // C06: PUT without guest assigns UUID
    let res = client
        .put(format!("{base}/api/v1/progress"))
        .json(&serde_json::json!({
            "lessonSlug": "bitwise-basics",
            "stepId": "step-and",
            "completed": true
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 200);
    let guest_header = res
        .headers()
        .get("x-guest-id")
        .and_then(|v| v.to_str().ok())
        .expect("x-guest-id issued")
        .to_string();
    let guest_id = Uuid::parse_str(&guest_header).unwrap();
    let body: Value = res.json().await.unwrap();
    assert_eq!(body["guestId"], guest_id.to_string());
    assert!(body["items"]
        .as_array()
        .unwrap()
        .iter()
        .any(|i| i["stepId"] == "step-and" && i["completed"] == true));

    // C07: PUT with guest persists
    let res = client
        .put(format!("{base}/api/v1/progress"))
        .header("x-guest-id", guest_id.to_string())
        .json(&serde_json::json!({
            "lessonSlug": "bitwise-basics",
            "stepId": "step-or",
            "completed": true
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 200);

    // C08: GET after "refresh" returns same completed steps
    let res = client
        .get(format!("{base}/api/v1/progress"))
        .header("x-guest-id", guest_id.to_string())
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 200);
    let body: Value = res.json().await.unwrap();
    let items = body["items"].as_array().unwrap();
    assert!(items.iter().any(|i| i["stepId"] == "step-and" && i["completed"] == true));
    assert!(items.iter().any(|i| i["stepId"] == "step-or" && i["completed"] == true));
}
