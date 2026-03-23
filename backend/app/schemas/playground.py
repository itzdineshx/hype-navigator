from pydantic import BaseModel, Field


class PlaygroundSimulationRequest(BaseModel):
    coin_name: str = Field(min_length=1, max_length=80)
    coin_symbol: str = Field(min_length=1, max_length=12)
    supply: int = Field(gt=0)
    launch_price: float = Field(gt=0)
    mentions_base: int = Field(ge=100, le=200000)
    sentiment: int = Field(ge=0, le=100)
    influencer_power: int = Field(ge=0, le=100)
    meme_virality: int = Field(ge=0, le=100)
    community_consistency: int = Field(ge=0, le=100)
    days: int = Field(default=30, ge=7, le=90)


class PlaygroundSimulationPoint(BaseModel):
    day: int
    price: float
    hype: float
    mentions: int
    market_cap: int


class PlaygroundSourceShare(BaseModel):
    source: str
    mentions: int


class PlaygroundSimulationResponse(BaseModel):
    points: list[PlaygroundSimulationPoint]
    source_share: list[PlaygroundSourceShare]
    model_name: str
    model_used: bool
    confidence: float = Field(ge=0, le=100)
    summary: dict[str, float]
