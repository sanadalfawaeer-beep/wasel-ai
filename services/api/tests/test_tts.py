from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app
from app.routers.tts import _build_ssml, _rate_value

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


def test_rate_value_uses_speech_synthesis_percentages() -> None:
    assert _rate_value(1.0) == "0%"
    assert _rate_value(0.95) == "-5%"
    assert _rate_value(1.1) == "+10%"


def test_ssml_escapes_text_and_uses_voice_language() -> None:
    ssml = _build_ssml("A & B < C", "en-US-AvaNeural", "-5%")
    assert "xml:lang='en-US'" in ssml
    assert "name='en-US-AvaNeural'" in ssml
    assert "A &amp; B &lt; C" in ssml
    assert "rate='-5%'" in ssml


def test_tts_provider_prefers_azure_when_configured() -> None:
    settings = Settings(
        _env_file=None,
        tts_provider="auto",
        azure_speech_key="test-key",
        azure_speech_region="westeurope",
    )
    assert settings.resolved_tts_provider == "azure"


def test_tts_provider_falls_back_to_edge() -> None:
    settings = Settings(_env_file=None, tts_provider="auto")
    assert settings.resolved_tts_provider == "edge"


def test_explicit_azure_does_not_silently_use_edge() -> None:
    settings = Settings(_env_file=None, tts_provider="azure")
    assert settings.resolved_tts_provider == "azure"
