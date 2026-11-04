from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-backed configuration.

    ``.env`` is loaded relative to the process working directory, which is
    ``services/api`` when running the documented commands.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-v4-pro"

    google_maps_api_key: str = ""
    planner_mode: Literal["auto", "mock", "google"] = "auto"
    transit_provider: Literal["auto", "mock", "google", "ammanbus"] = "auto"
    ammanbus_data_path: str = ""
    use_llm: bool = True

    allowed_origins: str = "*"
    debug: bool = True
    request_timeout_s: float = 12.0
    agent_timeout_s: float = 8.0

    # TTS: "auto" prefers Azure when a key is configured and falls back to
    # Edge TTS. Set "azure" or "edge" to force a provider.
    tts_provider: Literal["auto", "azure", "edge"] = "auto"
    azure_speech_key: str = ""
    azure_speech_region: str = ""

    @property
    def resolved_mode(self) -> Literal["mock", "google"]:
        if self.planner_mode == "mock":
            return "mock"
        if self.planner_mode == "google":
            return "google"
        return "google" if self.google_maps_api_key else "mock"

    @property
    def origins(self) -> list[str]:
        values = [item.strip() for item in self.allowed_origins.split(",") if item.strip()]
        return values or ["*"]

    @property
    def resolved_transit_provider(self) -> Literal["mock", "google", "ammanbus"]:
        if self.transit_provider == "auto":
            return "google" if self.google_maps_api_key else "mock"
        return self.transit_provider

    @property
    def llm_enabled(self) -> bool:
        return self.use_llm and bool(self.deepseek_api_key)

    @property
    def resolved_tts_provider(self) -> Literal["azure", "edge"]:
        if self.tts_provider == "azure":
            return "azure"
        if self.tts_provider == "edge":
            return "edge"
        if self.azure_speech_key and self.azure_speech_region:
            return "azure"
        return "edge"


@lru_cache
def get_settings() -> Settings:
    return Settings()
