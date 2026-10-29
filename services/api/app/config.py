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
    use_llm: bool = True

    allowed_origins: str = "*"
    debug: bool = True
    request_timeout_s: float = 12.0
    agent_timeout_s: float = 8.0

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
    def llm_enabled(self) -> bool:
        return self.use_llm and bool(self.deepseek_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
