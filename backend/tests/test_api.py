from fastapi.testclient import TestClient

from app.main import app


def test_health_and_fallback_generation(tmp_path, monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["planner_mode"] == "fallback"

        response = client.post(
            "/api/plans/generate",
            json={
                "destination": "Kyoto",
                "start_date": "2026-10-12",
                "end_date": "2026-10-15",
                "travelers": 2,
                "budget": 2400,
                "currency": "USD",
                "pace": "balanced",
                "interests": ["culture", "food"],
            },
        )
        assert response.status_code == 200
        body = response.json()
        assert body["mode"] == "fallback"
        assert len(body["itinerary"]) == 4
        assert body["budget"]["allocation"]["buffer"] == 192
