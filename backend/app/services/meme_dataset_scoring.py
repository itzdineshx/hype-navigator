import csv
import math
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.entities import Coin, TrendPoint


@dataclass
class MarketRow:
    date: datetime
    close: float
    volume: float
    market_cap: float


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _safe_float(value: str) -> float:
    raw = (value or "").strip().replace(",", "")
    if not raw:
        return 0.0
    try:
        return float(raw)
    except ValueError:
        return 0.0


def _parse_date(value: str) -> datetime:
    raw = (value or "").strip()
    for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    raise ValueError(f"Unsupported date format: {raw}")


def _stddev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / (len(values) - 1)
    return math.sqrt(variance)


def _clean_symbol_from_name(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9 ]", "", name).strip()
    if not cleaned:
        return "MEME"
    parts = [part for part in cleaned.split() if part]
    if len(parts) >= 2:
        ticker = "".join(part[0] for part in parts[:4]).upper()
        return ticker[:8] or "MEME"
    return cleaned.replace(" ", "").upper()[:8]


def _ticker_for_file(stem: str) -> str:
    special = {
        "Dogecoin": "DOGE",
        "Shiba INU": "SHIB",
        "Dogelon Mars": "ELON",
        "Akita Inu": "AKITA",
        "Cumrocket Crypto": "CUMMIES",
        "MemePad": "MEPAD",
        "PooCoin": "POOCOIN",
        "Monacoins": "MONA",
    }
    return special.get(stem, _clean_symbol_from_name(stem))


def _read_market_rows(file_path: Path) -> list[MarketRow]:
    rows: list[MarketRow] = []
    with file_path.open("r", encoding="utf-8", errors="ignore", newline="") as fp:
        reader = csv.DictReader(fp)
        for row in reader:
            try:
                date = _parse_date(str(row.get("Date", "")))
            except ValueError:
                continue
            close = _safe_float(str(row.get("Close", "0")))
            volume = _safe_float(str(row.get("Volume", "0")))
            market_cap = _safe_float(str(row.get("Market Cap", "0")))
            if close <= 0:
                continue
            rows.append(MarketRow(date=date, close=close, volume=volume, market_cap=market_cap))

    rows.sort(key=lambda item: item.date)
    return rows


def _pct_change(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0
    return (current / previous) - 1


def _score_coin(stem: str, rows: list[MarketRow]) -> dict[str, float | int | str]:
    latest = rows[-1]
    prev = rows[-2] if len(rows) > 1 else rows[-1]
    week_ref = rows[-8] if len(rows) > 8 else rows[0]
    month_ref = rows[-31] if len(rows) > 31 else rows[0]

    change_1d = _pct_change(latest.close, prev.close)
    change_7d = _pct_change(latest.close, week_ref.close)
    change_30d = _pct_change(latest.close, month_ref.close)

    recent_rows = rows[-30:] if len(rows) >= 30 else rows
    recent_returns: list[float] = []
    for idx in range(1, len(recent_rows)):
        recent_returns.append(_pct_change(recent_rows[idx].close, recent_rows[idx - 1].close))

    volatility_30d = _stddev(recent_returns)
    avg_volume_30d = sum(item.volume for item in recent_rows) / max(1, len(recent_rows))
    volume_spike = latest.volume / avg_volume_30d if avg_volume_30d > 0 else 1.0

    sentiment_compound = math.tanh(
        change_7d * 3.2 + change_30d * 2.2 + (volume_spike - 1) * 0.45 - volatility_30d * 10.0
    )
    sentiment_score = int(round(_clamp((sentiment_compound + 1) * 50, 0, 100)))

    mentions_proxy = int(round(_clamp(35 + (volume_spike - 1) * 50 + abs(change_7d) * 200, 0, 100)))
    hype_score = int(round(_clamp((sentiment_score * 0.5) + (mentions_proxy * 0.5), 0, 100)))

    stability_penalty = volatility_30d * 420 + max(0, -change_30d) * 50
    cap_bonus = min(20.0, math.log10(max(latest.market_cap, 1.0) + 1) * 1.8)
    trust_score = int(round(_clamp(72 + cap_bonus - stability_penalty, 0, 100)))

    if trust_score >= 75 and volatility_30d < 0.08:
        risk_level = "Low"
    elif trust_score >= 55 and volatility_30d < 0.16:
        risk_level = "Medium"
    elif trust_score >= 35:
        risk_level = "High"
    else:
        risk_level = "Critical"

    if sentiment_compound > 0.15:
        prediction = "Up"
    elif sentiment_compound < -0.15:
        prediction = "Down"
    else:
        prediction = "Sideways"

    prediction_confidence = int(round(_clamp(35 + abs(sentiment_compound) * 55 + abs(change_7d) * 80, 1, 99)))

    return {
        "coin_name": stem,
        "symbol": _ticker_for_file(stem),
        "latest_price": latest.close,
        "latest_volume": latest.volume,
        "latest_market_cap": latest.market_cap,
        "change_1d_pct": change_1d * 100,
        "change_7d_pct": change_7d * 100,
        "change_30d_pct": change_30d * 100,
        "volatility_30d": volatility_30d,
        "mentions_proxy": mentions_proxy,
        "sentiment_compound": sentiment_compound,
        "sentiment_score": sentiment_score,
        "hype_score": hype_score,
        "trust_score": trust_score,
        "risk_level": risk_level,
        "prediction": prediction,
        "prediction_confidence": prediction_confidence,
        "rows_used": len(rows),
    }


def _upsert_coin_and_trends(db: Session, score: dict[str, float | int | str], rows: list[MarketRow]) -> tuple[bool, int]:
    symbol = str(score["symbol"])
    name = str(score["coin_name"])

    coin = db.query(Coin).filter(Coin.symbol == symbol).first()
    created = False
    if coin is None:
        coin = Coin(
            symbol=symbol,
            name=name,
            price=float(score["latest_price"]),
            market_cap=float(score["latest_market_cap"]),
            volume_24h=float(score["latest_volume"]),
            change_24h=float(score["change_1d_pct"]),
            hype_score=int(score["hype_score"]),
            trust_score=int(score["trust_score"]),
            sentiment_score=int(score["sentiment_score"]),
            prediction=str(score["prediction"]),
            prediction_confidence=int(score["prediction_confidence"]),
            risk_level=str(score["risk_level"]),
        )
        db.add(coin)
        created = True
    else:
        coin.name = name
        coin.price = float(score["latest_price"])
        coin.market_cap = float(score["latest_market_cap"])
        coin.volume_24h = float(score["latest_volume"])
        coin.change_24h = float(score["change_1d_pct"])
        coin.hype_score = int(score["hype_score"])
        coin.trust_score = int(score["trust_score"])
        coin.sentiment_score = int(score["sentiment_score"])
        coin.prediction = str(score["prediction"])
        coin.prediction_confidence = int(score["prediction_confidence"])
        coin.risk_level = str(score["risk_level"])

    db.query(TrendPoint).filter(TrendPoint.coin_symbol == symbol).delete()

    recent = rows[-30:] if len(rows) >= 30 else rows
    trend_rows = 0
    for row in recent:
        mention_value = int(round(_clamp(float(score["mentions_proxy"]) * (row.volume / max(1.0, float(score["latest_volume"]))), 5, 999)))
        sentiment_value = int(score["sentiment_score"])
        db.add(
            TrendPoint(
                coin_symbol=symbol,
                ts=row.date,
                mentions=mention_value,
                sentiment=sentiment_value,
                price=row.close,
            )
        )
        trend_rows += 1

    return created, trend_rows


def _write_scores_csv(results: list[dict[str, float | int | str]], export_dir: Path) -> Path:
    export_dir.mkdir(parents=True, exist_ok=True)
    out_file = export_dir / f"meme_coin_scores_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    fieldnames = [
        "coin_name",
        "symbol",
        "latest_price",
        "latest_volume",
        "latest_market_cap",
        "change_1d_pct",
        "change_7d_pct",
        "change_30d_pct",
        "volatility_30d",
        "mentions_proxy",
        "sentiment_compound",
        "sentiment_score",
        "hype_score",
        "trust_score",
        "risk_level",
        "prediction",
        "prediction_confidence",
        "rows_used",
    ]

    with out_file.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.DictWriter(fp, fieldnames=fieldnames)
        writer.writeheader()
        for row in results:
            writer.writerow(row)

    return out_file


def score_meme_coin_dataset(
    db: Session,
    data_dir: str = "data/Meme Coin",
    export_dir: str = "backend/exports/scored",
) -> dict[str, object]:
    source_dir = Path(data_dir)
    if not source_dir.exists():
        return {
            "files_processed": 0,
            "coins_created": 0,
            "coins_updated": 0,
            "trend_rows_written": 0,
            "csv_path": None,
            "warnings": [f"Data directory not found: {source_dir}"],
        }

    results: list[dict[str, float | int | str]] = []
    warnings: list[str] = []
    created_count = 0
    updated_count = 0
    trend_rows_written = 0

    for file_path in sorted(source_dir.glob("*.csv")):
        rows = _read_market_rows(file_path)
        if len(rows) < 2:
            warnings.append(f"Skipped {file_path.name}: not enough rows")
            continue

        score = _score_coin(file_path.stem, rows)
        created, trend_count = _upsert_coin_and_trends(db, score, rows)
        if created:
            created_count += 1
        else:
            updated_count += 1
        trend_rows_written += trend_count
        results.append(score)

    db.commit()

    csv_path = _write_scores_csv(results, Path(export_dir)) if results else None

    return {
        "files_processed": len(results),
        "coins_created": created_count,
        "coins_updated": updated_count,
        "trend_rows_written": trend_rows_written,
        "csv_path": str(csv_path) if csv_path else None,
        "warnings": warnings,
        "top_sentiment": sorted(results, key=lambda item: float(item["sentiment_compound"]), reverse=True)[:5],
    }
