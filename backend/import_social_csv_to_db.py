import csv
from datetime import datetime
from pathlib import Path

from sqlalchemy import and_

from app.db.session import SessionLocal
from app.models.entities import SocialPost


def _parse_datetime(raw: str) -> datetime:
    text = (raw or "").strip()
    if not text:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        for fmt in ("%Y-%m-%d %H:%M:%S", "%d-%m-%Y %H:%M:%S"):
            try:
                return datetime.strptime(text, fmt)
            except ValueError:
                continue
    return datetime.utcnow()


def _to_int(raw: str) -> int:
    try:
        return int(float((raw or "0").strip()))
    except ValueError:
        return 0


def _to_float(raw: str) -> float:
    try:
        return float((raw or "0").strip())
    except ValueError:
        return 0.0


def _load_rows(csv_path: Path) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    with csv_path.open("r", encoding="utf-8", errors="ignore", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            source = str(row.get("source", "")).strip().lower()
            post_id = str(row.get("post_id", "")).strip()
            if not source or not post_id:
                continue
            rows.append(
                {
                    "source": source,
                    "post_id": post_id,
                    "author": str(row.get("author", "")).strip(),
                    "context": str(row.get("context", "")).strip(),
                    "text": str(row.get("text", "")).strip(),
                    "coin_symbol": str(row.get("coin_symbol", "")).strip().upper(),
                    "influencer_handle": str(row.get("influencer_handle", "")).strip(),
                    "engagement_score": _to_int(str(row.get("engagement_score", "0"))),
                    "sentiment_compound": _to_float(str(row.get("sentiment_compound", "0"))),
                    "created_at": _parse_datetime(str(row.get("created_at", ""))),
                }
            )
    return rows


def _upsert(db: SessionLocal, rows: list[dict[str, object]]) -> tuple[int, int]:
    inserted = 0
    updated = 0

    by_source: dict[str, list[dict[str, object]]] = {}
    for row in rows:
        by_source.setdefault(str(row["source"]), []).append(row)

    for source, source_rows in by_source.items():
        ids = [str(item["post_id"]) for item in source_rows]
        existing = (
            db.query(SocialPost)
            .filter(and_(SocialPost.source == source, SocialPost.post_id.in_(ids)))
            .all()
        )
        existing_map = {item.post_id: item for item in existing}

        for row in source_rows:
            record = existing_map.get(str(row["post_id"]))
            if record is None:
                db.add(SocialPost(**row))
                inserted += 1
            else:
                record.author = str(row["author"])
                record.context = str(row["context"])
                record.text = str(row["text"])
                record.coin_symbol = str(row["coin_symbol"])
                record.influencer_handle = str(row["influencer_handle"])
                record.engagement_score = int(row["engagement_score"])
                record.sentiment_compound = float(row["sentiment_compound"])
                record.created_at = row["created_at"]  # type: ignore[assignment]
                updated += 1

    db.commit()
    return inserted, updated


def main() -> None:
    base_dir = Path("exports/social")
    files = [base_dir / "twitter_2026-03-24.csv", base_dir / "reddit_2026-03-24.csv"]

    rows: list[dict[str, object]] = []
    for file_path in files:
        if not file_path.exists():
            print(f"Missing file: {file_path}")
            continue
        rows.extend(_load_rows(file_path))

    if not rows:
        print("No rows to import.")
        return

    db = SessionLocal()
    try:
        inserted, updated = _upsert(db, rows)
    finally:
        db.close()

    print(f"Rows imported: {len(rows)}")
    print(f"Inserted     : {inserted}")
    print(f"Updated      : {updated}")


if __name__ == "__main__":
    main()
