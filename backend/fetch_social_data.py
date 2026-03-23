import argparse
import asyncio
from typing import Any

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.schemas.social import SocialFetchRequest
from app.services.social_ingestion import fetch_and_store_social_data


def _print_result(result: dict[str, Any]) -> None:
    print("\nSocial Fetch Result")
    print("-" * 40)
    print(f"Twitter posts fetched : {result['fetched_twitter']}")
    print(f"Reddit posts fetched  : {result['fetched_reddit']}")
    print(f"Inserted into DB      : {result['inserted_db']}")
    print(f"Updated in DB         : {result['updated_db']}")
    print(f"CSV output            : {result.get('csv_path') or 'None'}")

    warnings = result.get("warnings") or []
    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"- {warning}")


async def _run(args: argparse.Namespace) -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        payload = SocialFetchRequest(
            include_twitter=not args.no_twitter,
            include_reddit=not args.no_reddit,
            twitter_limit=args.twitter_limit,
            reddit_limit=args.reddit_limit,
            store_in_db=not args.no_db,
            export_csv=not args.no_csv,
            twitter_queries=args.twitter_queries,
            reddit_subreddits=args.reddit_subreddits,
        )
        result = await fetch_and_store_social_data(db=db, settings=settings, payload=payload)
        _print_result(result.response.model_dump())
    finally:
        db.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch meme coin mentions from Twitter (twscrape) and Reddit (PRAW), then store into DB/CSV."
    )
    parser.add_argument("--twitter-limit", type=int, default=120, help="Max tweets per query")
    parser.add_argument("--reddit-limit", type=int, default=60, help="Max posts per subreddit")
    parser.add_argument("--twitter-queries", nargs="*", default=None, help="Override twitter queries")
    parser.add_argument("--reddit-subreddits", nargs="*", default=None, help="Override subreddit list")
    parser.add_argument("--no-twitter", action="store_true", help="Disable Twitter fetching")
    parser.add_argument("--no-reddit", action="store_true", help="Disable Reddit fetching")
    parser.add_argument("--no-db", action="store_true", help="Disable DB storage")
    parser.add_argument("--no-csv", action="store_true", help="Disable CSV export")
    return parser.parse_args()


if __name__ == "__main__":
    cli_args = parse_args()
    asyncio.run(_run(cli_args))
