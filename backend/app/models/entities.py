from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Coin(Base):
    __tablename__ = "coins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    symbol: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    price: Mapped[float] = mapped_column(Float)
    market_cap: Mapped[float] = mapped_column(Float)
    volume_24h: Mapped[float] = mapped_column(Float)
    change_24h: Mapped[float] = mapped_column(Float)
    hype_score: Mapped[int] = mapped_column(Integer)
    trust_score: Mapped[int] = mapped_column(Integer)
    sentiment_score: Mapped[int] = mapped_column(Integer)
    prediction: Mapped[str] = mapped_column(String(20))
    prediction_confidence: Mapped[int] = mapped_column(Integer)
    risk_level: Mapped[str] = mapped_column(String(20))


class TrendPoint(Base):
    __tablename__ = "trend_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    coin_symbol: Mapped[str] = mapped_column(String(20), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime, index=True)
    mentions: Mapped[int] = mapped_column(Integer)
    sentiment: Mapped[int] = mapped_column(Integer)
    price: Mapped[float] = mapped_column(Float)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String(20), index=True)
    title: Mapped[str] = mapped_column(String(120))
    coin_symbol: Mapped[str] = mapped_column(String(20), index=True)
    message: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20), index=True)
    status: Mapped[str] = mapped_column(String(30), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class Influencer(Base):
    __tablename__ = "influencers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    handle: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    followers: Mapped[int] = mapped_column(Integer)
    trust_score: Mapped[int] = mapped_column(Integer)
    impact_score: Mapped[int] = mapped_column(Integer)
    posts_24h: Mapped[int] = mapped_column(Integer)
    category: Mapped[str] = mapped_column(String(30), index=True)


class InfluenceMetric(Base):
    __tablename__ = "influence_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    influencer_handle: Mapped[str] = mapped_column(String(60), index=True)
    metric: Mapped[str] = mapped_column(String(50), index=True)
    value: Mapped[int] = mapped_column(Integer)


class ReplayEvent(Base):
    __tablename__ = "replay_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    coin_symbol: Mapped[str] = mapped_column(String(20), index=True)
    event_type: Mapped[str] = mapped_column(String(50), index=True)
    description: Mapped[str] = mapped_column(Text)
    impact_score: Mapped[int] = mapped_column(Integer)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, index=True)


class SocialPost(Base):
    __tablename__ = "social_posts"
    __table_args__ = (UniqueConstraint("source", "post_id", name="uq_social_posts_source_post_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source: Mapped[str] = mapped_column(String(20), index=True)
    post_id: Mapped[str] = mapped_column(String(120), index=True)
    author: Mapped[str] = mapped_column(String(120), index=True)
    context: Mapped[str] = mapped_column(String(120), default="")
    text: Mapped[str] = mapped_column(Text)
    coin_symbol: Mapped[str] = mapped_column(String(20), index=True, default="")
    influencer_handle: Mapped[str] = mapped_column(String(120), index=True, default="")
    engagement_score: Mapped[int] = mapped_column(Integer, default=0)
    sentiment_compound: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, index=True)
