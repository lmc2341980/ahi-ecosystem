from __future__ import annotations

from fastapi import FastAPI

from .config import get_settings
from .routers import organizations

settings = get_settings()

app = FastAPI(
    title="AHI Organization Service",
    description="Organization, member, and identity management for AHI",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    __import__("fastapi.middleware.cors", fromlist=["CORSMiddleware"]).CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(organizations.router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {"service": "ahi-organization", "version": "0.1.0"}
