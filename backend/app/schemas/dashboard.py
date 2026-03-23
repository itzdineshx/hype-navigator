from datetime import datetime

from pydantic import BaseModel


class CoinOut(BaseModel):
    symbol: str
    name: str
    price: float
    market_cap: float
    volume_24h: float
    change_24h: float
    hype_score: int
    trust_score: int
    sentiment_score: int
    prediction: str
    prediction_confidence: int
    risk_level: str

    model_config = {"from_attributes": True}


class DexPairOut(BaseModel):
    chain_id: str | None = None
    dex_id: str | None = None
    pair_address: str | None = None
    url: str | None = None
    price_usd: float | None = None
    price_change_h24: float | None = None
    liquidity_usd: float | None = None
    fdv: float | None = None
    market_cap: float | None = None
    volume_h24: float | None = None
    base_symbol: str | None = None
    base_name: str | None = None
    quote_symbol: str | None = None
    labels: list[str] = []


class DexLinkOut(BaseModel):
    type: str
    label: str
    url: str


class DexTokenProfileOut(BaseModel):
    chain_id: str | None = None
    token_address: str | None = None
    icon: str | None = None
    header: str | None = None
    description: str | None = None
    links: list[DexLinkOut] = []


class CoinDetailOut(CoinOut):
    dex_pair: DexPairOut | None = None
    dex_profile: DexTokenProfileOut | None = None
    emoji: str
    market_emoji: str
    price_source: str
    last_updated: datetime


class CoinRealtimeOut(CoinDetailOut):
    top_pairs: list[DexPairOut] = []
    data_provider: str = "dexscreener"


class DashboardSummary(BaseModel):
    tracked_coins: int
    average_hype_score: float
    average_trust_score: float
    active_alerts: int
    market_sentiment: float


class TrendPointOut(BaseModel):
    coin_symbol: str
    ts: datetime
    mentions: int
    sentiment: int
    price: float

    model_config = {"from_attributes": True}


class AlertOut(BaseModel):
    id: int
    type: str
    title: str
    coin_symbol: str
    message: str
    severity: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertCreate(BaseModel):
    type: str
    title: str
    coin_symbol: str
    message: str
    severity: str
    status: str = "active"


class AlertStatusUpdate(BaseModel):
    status: str


class InfluencerOut(BaseModel):
    handle: str
    name: str
    followers: int
    trust_score: int
    impact_score: int
    posts_24h: int
    category: str

    model_config = {"from_attributes": True}


class InfluenceMetricOut(BaseModel):
    influencer_handle: str
    metric: str
    value: int

    model_config = {"from_attributes": True}


class ReplayEventOut(BaseModel):
    id: int
    coin_symbol: str
    event_type: str
    description: str
    impact_score: int
    occurred_at: datetime

    model_config = {"from_attributes": True}
