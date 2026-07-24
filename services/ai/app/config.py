from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AI_",
        env_file=".env",
        extra="ignore",
    )

    service_name: str = "ai"
    environment: str = Field(default="development")
    port: int = Field(default=8002)

    openai_api_key: str = Field(default="")
    openai_base_url: str = Field(default="https://api.openai.com/v1")

    gemini_api_key: str = Field(default="")
    gemini_base_url: str = Field(default="https://generativelanguage.googleapis.com/v1beta")

    ollama_base_url: str = Field(default="http://localhost:11434")

    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")
    supabase_service_role_key: str = Field(default="")

    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
