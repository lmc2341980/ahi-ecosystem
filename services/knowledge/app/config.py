from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="KNOWLEDGE_",
        env_file=".env",
        extra="ignore",
    )

    service_name: str = "knowledge"
    environment: str = Field(default="development")
    port: int = Field(default=8003)

    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")
    supabase_service_role_key: str = Field(default="")

    ai_service_base_url: str = Field(default="http://localhost:8002")

    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
