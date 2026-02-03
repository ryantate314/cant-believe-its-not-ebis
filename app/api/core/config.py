from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cirrus"

    # API settings
    api_v1_prefix: str = "/api/v1"

    # Azure AD settings
    azure_ad_tenant_id: str = ""
    azure_ad_client_id: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
