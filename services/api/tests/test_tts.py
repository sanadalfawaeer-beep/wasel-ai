from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_tts_rejects_unknown_voice() -> None:
    response = client.get(
        "/api/tts",
        params={"text": "مرحبا", "voice": "not-a-voice"},
    )
    assert response.status_code == 400


def test_tts_rejects_empty_text() -> None:
    response = client.get(
        "/api/tts",
        params={"text": "", "voice": "ar-JO-SanaNeural"},
    )
    assert response.status_code == 422
