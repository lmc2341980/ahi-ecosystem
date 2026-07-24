from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="ORGANIZATION_",
        env_file=".env",
        extra="ignore",
    )

    service_name: str = "organization"
    environment: str = Field(default="development")
    port: int = Field(default=8001)

    database_url: str = Field(
        default="postgresql://ahi:ahi_password@localhost:5432/ahi_organization"
    )

    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")
    supabase_service_role_key: str = Field(default="")

    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
