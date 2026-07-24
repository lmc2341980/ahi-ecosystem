from __future__ import annotations

from supabase import create_client, Client

from .config import get_settings

_settings = get_settings()

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = _settings.supabase_url
        key = _settings.supabase_service_role_key or _settings.supabase_anon_key
        if not url or not key:
            raise RuntimeError("Supabase URL and key must be configured")
        _client = create_client(url, key)
    return _client
