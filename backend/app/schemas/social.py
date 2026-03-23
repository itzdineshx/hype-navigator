from datetime import datetime

from pydantic import BaseModel, Field


class SocialFetchRequest(BaseModel):
    include_twitter: bool = True
    include_reddit: bool = True
    twitter_limit: int = Field(default=120, ge=1, le=1000)
    reddit_limit: int = Field(default=60, ge=1, le=500)
    twitter_queries: list[str] | None = None
    reddit_subreddits: list[str] | None = None
    store_in_db: bool = True
    export_csv: bool = True


class SocialPostOut(BaseModel):
    source: str
    post_id: str
    author: str
    context: str
    text: str
    coin_symbol: str
    influencer_handle: str
    engagement_score: int
    sentiment_compound: float
    created_at: datetime

    model_config = {"from_attributes": True}


class SocialFetchResponse(BaseModel):
    fetched_twitter: int
    fetched_reddit: int
    inserted_db: int
    updated_db: int
    csv_path: str | None = None
    warnings: list[str] = []
