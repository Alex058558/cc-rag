from supabase import create_client, Client
from backend.config import get_settings


def get_supabase_client(access_token: str | None = None) -> Client:
    settings = get_settings()
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    if access_token:
        client.auth.set_session(access_token, "")
    return client


def get_supabase_admin() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
