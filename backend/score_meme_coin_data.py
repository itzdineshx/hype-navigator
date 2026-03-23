from app.db.session import SessionLocal
from app.services.meme_dataset_scoring import score_meme_coin_dataset


if __name__ == "__main__":
    db = SessionLocal()
    try:
        result = score_meme_coin_dataset(db=db)
    finally:
        db.close()

    print("\nMeme Coin Scoring Result")
    print("-" * 40)
    print(f"Files processed   : {result['files_processed']}")
    print(f"Coins created     : {result['coins_created']}")
    print(f"Coins updated     : {result['coins_updated']}")
    print(f"Trend rows written: {result['trend_rows_written']}")
    print(f"CSV path          : {result['csv_path']}")

    warnings = result.get("warnings") or []
    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"- {warning}")

    print("\nTop sentiment coins:")
    for idx, row in enumerate(result.get("top_sentiment") or [], start=1):
        print(
            f"{idx}. {row['symbol']} ({row['coin_name']}): sentiment={float(row['sentiment_compound']):.3f}, "
            f"hype={int(row['hype_score'])}, trust={int(row['trust_score'])}, prediction={row['prediction']}"
        )
