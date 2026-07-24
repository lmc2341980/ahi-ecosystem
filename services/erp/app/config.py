from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="ERP_",
        env_file=".env",
        extra="ignore",
    )

    service_name: str = "erp"
    environment: str = Field(default="development")
    port: int = Field(default=8004)

    database_url: str = Field(
        default="postgresql://ahi:ahi_password@localhost:5432/ahi_organization"
    )

    erpnext_base_url: str = Field(default="")
    erpnext_api_key: str = Field(default="")
    erpnext_api_secret: str = Field(default="")

    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
