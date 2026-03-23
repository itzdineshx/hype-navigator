from functools import lru_cache

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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
