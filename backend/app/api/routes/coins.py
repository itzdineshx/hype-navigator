from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import Alert, Coin, Influencer
from app.schemas import AlertOut, CoinDetailOut, CoinOut, CoinRealtimeOut, DexPairOut, DexTokenProfileOut, InfluencerOut
from app.services.dexscreener import fetch_realtime_coin_snapshot, market_mood_emoji

router = APIRouter()


@router.get("", response_model=list[CoinOut])
def list_coins(
    search: str | None = Query(default=None),
    min_hype_score: int | None = Query(default=None, ge=0, le=100),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[CoinOut]:
    query = db.query(Coin)
    if search:
        pattern = f"%{search.upper()}%"
        query = query.filter(Coin.symbol.like(pattern) | Coin.name.like(f"%{search}%"))
    if min_hype_score is not None:
        query = query.filter(Coin.hype_score >= min_hype_score)
    return query.order_by(Coin.hype_score.desc()).limit(limit).all()


@router.get("/{symbol}", response_model=CoinDetailOut)
def get_coin(symbol: str, db: Session = Depends(get_db)) -> CoinDetailOut:
    coin = db.query(Coin).filter(Coin.symbol == symbol.upper()).first()
    if not coin:
        raise HTTPException(status_code=404, detail=f"Coin '{symbol}' not found")

    snapshot = fetch_realtime_coin_snapshot(symbol=coin.symbol)
    pair_payload = snapshot.get("dex_pair")
    profile_payload = snapshot.get("dex_profile")
    dex_pair = DexPairOut(**pair_payload) if pair_payload else None
    dex_profile = DexTokenProfileOut(**profile_payload) if profile_payload else None

    price_change = (
        dex_pair.price_change_h24 if dex_pair and dex_pair.price_change_h24 is not None else coin.change_24h
    )
    mood_emoji = market_mood_emoji(price_change, coin.trust_score, coin.hype_score)

    return CoinDetailOut(
        symbol=coin.symbol,
        name=coin.name,
        price=dex_pair.price_usd if dex_pair and dex_pair.price_usd is not None else coin.price,
        market_cap=dex_pair.market_cap if dex_pair and dex_pair.market_cap is not None else coin.market_cap,
        volume_24h=dex_pair.volume_h24 if dex_pair and dex_pair.volume_h24 is not None else coin.volume_24h,
        change_24h=price_change,
        hype_score=coin.hype_score,
        trust_score=coin.trust_score,
        sentiment_score=coin.sentiment_score,
        prediction=coin.prediction,
        prediction_confidence=coin.prediction_confidence,
        risk_level=coin.risk_level,
        dex_pair=dex_pair,
        dex_profile=dex_profile,
        emoji=snapshot.get("emoji") or "\U0001FA99",
        market_emoji=mood_emoji,
        price_source="dexscreener" if dex_pair else "local_db",
        last_updated=datetime.utcnow(),
    )


@router.get("/{symbol}/realtime", response_model=CoinRealtimeOut)
def get_coin_realtime(symbol: str, db: Session = Depends(get_db)) -> CoinRealtimeOut:
    coin = db.query(Coin).filter(Coin.symbol == symbol.upper()).first()
    if not coin:
        raise HTTPException(status_code=404, detail=f"Coin '{symbol}' not found")

    snapshot = fetch_realtime_coin_snapshot(symbol=coin.symbol)
    pair_payload = snapshot.get("dex_pair")
    profile_payload = snapshot.get("dex_profile")
    top_pairs_payload = snapshot.get("top_pairs") or []

    dex_pair = DexPairOut(**pair_payload) if pair_payload else None
    dex_profile = DexTokenProfileOut(**profile_payload) if profile_payload else None
    top_pairs = [DexPairOut(**pair) for pair in top_pairs_payload]

    price_change = (
        dex_pair.price_change_h24 if dex_pair and dex_pair.price_change_h24 is not None else coin.change_24h
    )
    mood_emoji = market_mood_emoji(price_change, coin.trust_score, coin.hype_score)

    return CoinRealtimeOut(
        symbol=coin.symbol,
        name=coin.name,
        price=dex_pair.price_usd if dex_pair and dex_pair.price_usd is not None else coin.price,
        market_cap=dex_pair.market_cap if dex_pair and dex_pair.market_cap is not None else coin.market_cap,
        volume_24h=dex_pair.volume_h24 if dex_pair and dex_pair.volume_h24 is not None else coin.volume_24h,
        change_24h=price_change,
        hype_score=coin.hype_score,
        trust_score=coin.trust_score,
        sentiment_score=coin.sentiment_score,
        prediction=coin.prediction,
        prediction_confidence=coin.prediction_confidence,
        risk_level=coin.risk_level,
        dex_pair=dex_pair,
        dex_profile=dex_profile,
        top_pairs=top_pairs,
        emoji=snapshot.get("emoji") or "\U0001FA99",
        market_emoji=mood_emoji,
        price_source="dexscreener" if dex_pair else "local_db",
        last_updated=datetime.utcnow(),
    )


@router.get("/{symbol}/alerts", response_model=list[AlertOut])
def get_coin_alerts(
    symbol: str,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[AlertOut]:
    return (
        db.query(Alert)
        .filter(Alert.coin_symbol == symbol.upper())
        .order_by(Alert.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/{symbol}/influencers", response_model=list[InfluencerOut])
def get_coin_influencers(symbol: str, db: Session = Depends(get_db)) -> list[InfluencerOut]:
    # Temporary signal: return top influencers for tracked symbols.
    coin_exists = db.query(Coin.id).filter(Coin.symbol == symbol.upper()).first()
    if not coin_exists:
        raise HTTPException(status_code=404, detail=f"Coin '{symbol}' not found")
    return db.query(Influencer).order_by(Influencer.impact_score.desc()).limit(10).all()
