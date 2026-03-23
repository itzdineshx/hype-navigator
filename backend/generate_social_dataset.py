import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

FIELDNAMES = [
    "source",
    "post_id",
    "author",
    "context",
    "text",
    "coin_symbol",
    "influencer_handle",
    "engagement_score",
    "sentiment_compound",
    "created_at",
]

COINS = ["DOGE", "SHIB", "PEPE", "BONK", "WIF"]
HANDLES = [
    "WhaleScope",
    "ChainAlpha",
    "DegenDesk",
    "MemePulse",
    "CryptoKing",
    "ShibIntel",
    "FrogCycle",
    "BonkRadar",
    "WifSignals",
    "MacroMeme",
    "AltcoinNora",
    "MemeRiskLab",
]
TWITTER_CONTEXTS = [
    "(doge OR pepe OR shib OR bonk OR wif) lang:en",
    "meme momentum",
    "social spike watch",
]
REDDIT_CONTEXTS = ["CryptoCurrency", "CryptoMarkets", "SatoshiStreetBets", "memecoins"]
PHRASES = [
    "strong breakout with heavy engagement",
    "rotation into meme basket continues",
    "sentiment cooling after leverage spike",
    "community activity accelerating",
    "volume confirms trend continuation",
    "range chop with selective strength",
    "watch exchange inflow risk",
    "new wave of retail mentions",
    "buyers defending support aggressively",
    "momentum still healthy despite volatility",
]


def _generate_rows(source: str, row_count: int, seed: int) -> list[dict[str, str | int | float]]:
    random.seed(seed)
    rows: list[dict[str, str | int | float]] = []
    start = datetime(2026, 3, 24, 0, 0, 0)

    for idx in range(1, row_count + 1):
        coin = random.choice(COINS)
        handle = random.choice(HANDLES)
        phrase = random.choice(PHRASES)
        text = f"{coin} {phrase}."

        if source == "twitter":
            author = handle
            context = random.choice(TWITTER_CONTEXTS)
            engagement = int(max(20, random.gauss(860, 270)))
            sentiment = max(-0.95, min(0.95, random.gauss(0.15 if coin in ["DOGE", "BONK"] else 0.05, 0.35)))
        else:
            author = f"u/{handle.lower()}"
            context = random.choice(REDDIT_CONTEXTS)
            engagement = int(max(10, random.gauss(240, 95)))
            sentiment = max(-0.95, min(0.95, random.gauss(0.12 if coin in ["DOGE", "PEPE"] else 0.03, 0.32)))

        ts = start + timedelta(minutes=idx * 3 + (0 if source == "twitter" else 1))
        rows.append(
            {
                "source": source,
                "post_id": f"{source[:2]}_2403_{idx:04d}",
                "author": author,
                "context": context,
                "text": text,
                "coin_symbol": coin,
                "influencer_handle": handle,
                "engagement_score": engagement,
                "sentiment_compound": round(float(sentiment), 3),
                "created_at": ts.isoformat(),
            }
        )

    return rows


def _write_csv(path: Path, rows: list[dict[str, str | int | float]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    target_dir = Path("exports/social")

    twitter_rows = _generate_rows(source="twitter", row_count=500, seed=24032026)
    reddit_rows = _generate_rows(source="reddit", row_count=500, seed=24032027)

    twitter_file = target_dir / "twitter_2026-03-24.csv"
    reddit_file = target_dir / "reddit_2026-03-24.csv"

    _write_csv(twitter_file, twitter_rows)
    _write_csv(reddit_file, reddit_rows)

    print(f"Generated: {twitter_file} ({len(twitter_rows)} rows)")
    print(f"Generated: {reddit_file} ({len(reddit_rows)} rows)")


if __name__ == "__main__":
    main()
