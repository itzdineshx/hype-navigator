import json
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Hype Navigator API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./hype_navigator.db"
    cors_origins: list[str] = ["http://localhost:8080", "http://127.0.0.1:8080"]
    reddit_client_id: str | None = None
    reddit_client_secret: str | None = None
    reddit_user_agent: str = "HypeNavigator/1.0"
    reddit_subreddits: list[str] = ["CryptoCurrency", "CryptoMarkets", "SatoshiStreetBets", "memecoins"]
    twitter_queries: list[str] = ["(doge OR pepe OR shib OR bonk OR wif) lang:en"]
    social_default_reddit_limit: int = 60
    social_default_twitter_limit: int = 120
    twitter_accounts_db: str = "./twscrape_accounts.db"
    social_csv_dir: str = "./exports/social"
    etherscan_api_key: str | None = None
    dexscreener_search_url: str = "https://api.dexscreener.com/latest/dex/search"
    dexscreener_profile_url: str = "https://api.dexscreener.com/token-profiles/latest/v1"
    coindesk_api_key: str | None = None
    coingecko_api_key: str | None = None

    @staticmethod
    def _backend_root() -> Path:
        return Path(__file__).resolve().parents[2]

    @classmethod
    def _resolve_backend_path(cls, raw_path: str) -> str:
        path_value = Path(raw_path)
        if path_value.is_absolute():
            return str(path_value)
        return str((cls._backend_root() / path_value).resolve())

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []
            if raw.startswith("["):
                return json.loads(raw)
            return [item.strip() for item in raw.split(",") if item.strip()]
        return value

    @field_validator("reddit_subreddits", "twitter_queries", mode="before")
    @classmethod
    def parse_list_fields(cls, value: object) -> object:
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []
            if raw.startswith("["):
                return json.loads(raw)
            return [item.strip() for item in raw.split(",") if item.strip()]
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        raw = value.strip()
        if raw.startswith("sqlite:///"):
            sqlite_path = raw[len("sqlite:///") :]
            if sqlite_path.startswith("./") or sqlite_path.startswith("../"):
                resolved = cls._resolve_backend_path(sqlite_path)
                normalized = resolved.replace("\\", "/")
                return f"sqlite:///{normalized}"
        return value

    @field_validator("twitter_accounts_db", "social_csv_dir", mode="before")
    @classmethod
    def normalize_backend_paths(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        raw = value.strip()
        if not raw:
            return value
        return cls._resolve_backend_path(raw)

    model_config = SettingsConfigDict(
        env_file=("backend/.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
