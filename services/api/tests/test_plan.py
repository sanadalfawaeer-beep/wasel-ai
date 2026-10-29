from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_mock_mode() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["mode"] == "mock"
    assert payload["llm"] is False


def test_demo_route_has_cues() -> None:
    response = client.get("/api/demo", params={"lang": "en"})

    assert response.status_code == 200
    route = response.json()["route"]
    assert route["provider"] == "mock"
    assert route["language"] == "en"
    assert len(route["cues"]) >= 5
    assert route["cues"][0]["kind"] == "DEPART"
    assert route["cues"][-1]["kind"] == "ARRIVE"
    assert len(route["points"]) >= 2


def test_plan_falls_back_without_llm() -> None:
    response = client.post(
        "/api/plan",
        json={
            "text": "Take me to the library",
            "lat": 32.0134,
            "lng": 35.8734,
            "lang": "en",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["route"]["provider"] == "mock"
    assert "Library" in payload["route"]["destination"]["name"]
    assert len(payload["route"]["cues"]) >= 5
    assert payload["debug"]["planner"] == "fallback"
    assert payload["debug"]["mode"] == "mock"
    assert any(item["tool"] == "fallback_find_place" for item in payload["debug"]["tool_log"])


def test_plan_arabic() -> None:
    response = client.post(
        "/api/plan",
        json={
            "text": "خذني إلى المكتبة",
            "lat": 32.0134,
            "lng": 35.8734,
            "lang": "ar",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["route"]["language"] == "ar"
    assert "مكتبة" in payload["route"]["destination"]["name"]
    assert payload["route"]["cues"][0]["short"] == "ابدأ"
    assert "سأسير" in payload["reply"]


def test_mock_routes_are_distinct() -> None:
    gate = client.post(
        "/api/plan",
        json={"text": "Take me to the Main Gate", "lang": "en"},
    )
    student = client.post(
        "/api/plan",
        json={"text": "Take me to the Student Center", "lang": "en"},
    )

    assert gate.status_code == 200
    assert student.status_code == 200
    gate_route = gate.json()["route"]
    student_route = student.json()["route"]

    assert "gate" in gate_route["route_id"]
    assert "student" in student_route["route_id"]
    assert gate_route["destination"]["name"].endswith("Main Gate")
    assert "Student Center" in student_route["destination"]["name"]
    assert gate_route["points"] != student_route["points"]
    assert gate_route["distance_m"] != student_route["distance_m"]
    assert len(gate_route["cues"]) == 5
    assert len(student_route["cues"]) == 5


def test_plan_accepts_constraints() -> None:
    response = client.post(
        "/api/plan",
        json={
            "text": "Take me to the main gate",
            "lang": "en",
            "constraints": ["step_free", "avoid_stairs"],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["debug"]["constraints"] == ["step_free", "avoid_stairs"]
