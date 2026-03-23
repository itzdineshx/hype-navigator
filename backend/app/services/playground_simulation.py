from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np

from app.schemas.playground import (
    PlaygroundSimulationPoint,
    PlaygroundSimulationRequest,
    PlaygroundSimulationResponse,
    PlaygroundSourceShare,
)

ARTIFACT_DIR = Path(__file__).resolve().parents[2] / "ml_artifacts"
PRICE_MODEL_ARTIFACT = ARTIFACT_DIR / "price_direction_predictor.joblib"


def _seeded_noise(seed: float) -> float:
    x = np.sin(seed * 12.9898) * 43758.5453
    return float(x - np.floor(x))


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _build_source_share(total_mentions: int, payload: PlaygroundSimulationRequest) -> list[PlaygroundSourceShare]:
    twitter_share = _clamp(0.47 + (payload.meme_virality - 50) / 250, 0.28, 0.72)
    reddit_share = _clamp(0.31 + (payload.community_consistency - 50) / 280, 0.14, 0.52)
    telegram_share = _clamp(1 - twitter_share - reddit_share, 0.08, 0.4)

    twitter = int(round(total_mentions * twitter_share))
    reddit = int(round(total_mentions * reddit_share))
    telegram = int(round(total_mentions * telegram_share))
    other = max(0, total_mentions - twitter - reddit - telegram)

    return [
        PlaygroundSourceShare(source="Twitter/X", mentions=twitter),
        PlaygroundSourceShare(source="Reddit", mentions=reddit),
        PlaygroundSourceShare(source="Telegram", mentions=telegram),
        PlaygroundSourceShare(source="Other", mentions=other),
    ]


def _load_price_model() -> tuple[Any | None, str, bool]:
    if not PRICE_MODEL_ARTIFACT.exists():
        return None, "heuristic-fallback", False

    try:
        model = joblib.load(PRICE_MODEL_ARTIFACT)
        return model, PRICE_MODEL_ARTIFACT.name, True
    except Exception:
        return None, "heuristic-fallback", False


def simulate_playground(payload: PlaygroundSimulationRequest) -> PlaygroundSimulationResponse:
    model, model_name, model_used = _load_price_model()

    price = payload.launch_price
    points: list[PlaygroundSimulationPoint] = []
    confidence_samples: list[float] = []

    previous_mentions = float(payload.mentions_base)
    previous_price = price

    for day in range(payload.days + 1):
        wave = np.sin((day / max(payload.days, 1)) * np.pi * 2) * (payload.meme_virality / 10)
        burst = _seeded_noise(day + payload.influencer_power) * (payload.influencer_power / 4)
        sentiment_factor = (payload.sentiment - 50) / 50
        consistency_factor = (payload.community_consistency - 50) / 50

        mentions = max(
            100,
            int(
                round(
                    payload.mentions_base
                    * (1 + day * 0.03 + wave * 0.02 + burst * 0.04 + consistency_factor * 0.2)
                )
            ),
        )

        hype = _clamp(
            50
            + (mentions / max(payload.mentions_base, 1) - 1) * 30
            + sentiment_factor * 22
            + (payload.influencer_power - 50) * 0.35
            + burst * 0.9,
            0,
            100,
        )

        mention_delta = mentions - previous_mentions
        price_return = (price - previous_price) / max(previous_price, 1e-9)
        trust_proxy = _clamp(
            payload.community_consistency * 0.55 + payload.sentiment * 0.45,
            0,
            100,
        )

        base_drift = (hype - 50) / 320 + sentiment_factor / 100 + consistency_factor / 180
        volatility = (_seeded_noise(day * 17 + payload.meme_virality) - 0.5) * 0.09

        model_bias = 0.0
        if model is not None:
            features = np.array(
                [[mentions, mention_delta, payload.sentiment, price_return, hype, trust_proxy]],
                dtype=float,
            )
            try:
                if hasattr(model, "predict_proba"):
                    probabilities = model.predict_proba(features)
                    proba_up = float(probabilities[0][1]) if probabilities.shape[1] > 1 else float(probabilities[0][0])
                    confidence_samples.append(abs(proba_up - 0.5) * 200)
                    model_bias = (proba_up - 0.5) * 0.018
                else:
                    prediction = int(model.predict(features)[0])
                    confidence_samples.append(58.0)
                    model_bias = 0.008 if prediction == 1 else -0.008
            except Exception:
                model_bias = 0.0

        previous_price = price
        price = max(0.0000001, price * (1 + base_drift + model_bias + volatility))
        previous_mentions = float(mentions)

        points.append(
            PlaygroundSimulationPoint(
                day=day,
                price=round(price, 6),
                hype=round(float(hype), 2),
                mentions=mentions,
                market_cap=int(round(price * payload.supply)),
            )
        )

    total_mentions = int(sum(point.mentions for point in points))
    source_share = _build_source_share(total_mentions, payload)

    first_price = points[0].price if points else payload.launch_price
    final_price = points[-1].price if points else payload.launch_price
    peak_price = max((point.price for point in points), default=payload.launch_price)
    low_price = min((point.price for point in points), default=payload.launch_price)
    growth_pct = ((final_price - first_price) / max(first_price, 1e-9)) * 100
    max_drawdown_pct = ((peak_price - low_price) / max(peak_price, 1e-9)) * 100

    avg_confidence = float(np.mean(confidence_samples)) if confidence_samples else 58.0

    return PlaygroundSimulationResponse(
        points=points,
        source_share=source_share,
        model_name=model_name,
        model_used=model_used,
        confidence=round(avg_confidence, 2),
        summary={
            "final_price": round(final_price, 6),
            "peak_price": round(peak_price, 6),
            "growth_pct": round(growth_pct, 3),
            "max_drawdown_pct": round(max_drawdown_pct, 3),
        },
    )
