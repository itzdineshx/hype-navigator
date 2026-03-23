import csv
import re
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import and_
from sqlalchemy.orm import Session
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.core.config import Settings
from app.models.entities import Coin, SocialPost
from app.schemas.social import SocialFetchRequest, SocialFetchResponse


@dataclass
class SocialIngestionResult:
    response: SocialFetchResponse
    posts: list[dict[str, Any]]


def _to_naive_utc(value: datetime | None) -> datetime:
    if value is None:
        return datetime.utcnow()
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _extract_coin_symbol(text: str, tracked_symbols: set[str]) -> str:
    upper = text.upper()
    for symbol in tracked_symbols:
        if re.search(rf"(?<![A-Z0-9]){re.escape(symbol)}(?![A-Z0-9])", upper):
            return symbol
    return ""


def _normalize_text(*parts: str) -> str:
    return " ".join(part.strip() for part in parts if part and part.strip()).strip()


async def _fetch_twitter_posts(
    queries: list[str],
    limit: int,
    tracked_symbols: set[str],
    analyzer: SentimentIntensityAnalyzer,
    accounts_db: str,
) -> tuple[list[dict[str, Any]], list[str]]:
    warnings: list[str] = []
    posts: list[dict[str, Any]] = []

    try:
        from twscrape import API, gather  # type: ignore
    except Exception:
        warnings.append("twscrape is not installed. Install dependencies to enable Twitter scraping.")
        return posts, warnings

    # twscrape accepts the accounts db path as the first positional argument.
    api = API(accounts_db)

    for query in queries:
        try:
            tweets = await gather(api.search(query, limit=limit))
        except Exception as exc:
            warnings.append(f"Twitter fetch failed for query '{query}': {exc}")
            continue

        for tweet in tweets:
            text = _normalize_text(getattr(tweet, "rawContent", "") or getattr(tweet, "content", ""))
            if not text:
                continue

            author = ""
            user_obj = getattr(tweet, "user", None)
            if user_obj is not None:
                author = str(getattr(user_obj, "username", "") or "")

            engagement = int(
                (getattr(tweet, "likeCount", 0) or 0)
                + (getattr(tweet, "retweetCount", 0) or 0)
                + (getattr(tweet, "replyCount", 0) or 0)
                + (getattr(tweet, "quoteCount", 0) or 0)
            )
            sentiment = analyzer.polarity_scores(text).get("compound", 0.0)
            created_at = _to_naive_utc(getattr(tweet, "date", None))
            post_id = str(getattr(tweet, "id", ""))
            if not post_id:
                continue

            posts.append(
                {
                    "source": "twitter",
                    "post_id": post_id,
                    "author": author,
                    "context": query,
                    "text": text,
                    "coin_symbol": _extract_coin_symbol(text, tracked_symbols),
                    "influencer_handle": author,
                    "engagement_score": engagement,
                    "sentiment_compound": float(sentiment),
                    "created_at": created_at,
                }
            )

    return posts, warnings


def _fetch_reddit_posts(
    subreddits: list[str],
    limit: int,
    tracked_symbols: set[str],
    analyzer: SentimentIntensityAnalyzer,
    settings: Settings,
) -> tuple[list[dict[str, Any]], list[str]]:
    warnings: list[str] = []
    posts: list[dict[str, Any]] = []

    if not settings.reddit_client_id or not settings.reddit_client_secret:
        warnings.append("Reddit credentials are missing. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to fetch Reddit posts.")
        return posts, warnings

    try:
        import praw  # type: ignore
    except Exception:
        warnings.append("praw is not installed. Install dependencies to enable Reddit fetching.")
        return posts, warnings

    try:
        reddit = praw.Reddit(
            client_id=settings.reddit_client_id,
            client_secret=settings.reddit_client_secret,
            user_agent=settings.reddit_user_agent,
        )
    except Exception as exc:
        warnings.append(f"Reddit client initialization failed: {exc}")
        return posts, warnings

    for subreddit_name in subreddits:
        try:
            subreddit = reddit.subreddit(subreddit_name)
            submissions: Iterable[Any] = subreddit.new(limit=limit)
        except Exception as exc:
            warnings.append(f"Reddit fetch failed for subreddit '{subreddit_name}': {exc}")
            continue

        for submission in submissions:
            title = str(getattr(submission, "title", "") or "")
            body = str(getattr(submission, "selftext", "") or "")
            text = _normalize_text(title, body)
            if not text:
                continue

            author_obj = getattr(submission, "author", None)
            author = str(author_obj) if author_obj is not None else ""
            post_id = str(getattr(submission, "id", ""))
            if not post_id:
                continue

            score = int(getattr(submission, "score", 0) or 0)
            comments = int(getattr(submission, "num_comments", 0) or 0)
            engagement = score + comments
            sentiment = analyzer.polarity_scores(text).get("compound", 0.0)
            created_utc = getattr(submission, "created_utc", None)
            created_at = datetime.utcfromtimestamp(float(created_utc)) if created_utc else datetime.utcnow()

            posts.append(
                {
                    "source": "reddit",
                    "post_id": post_id,
                    "author": author,
                    "context": subreddit_name,
                    "text": text,
                    "coin_symbol": _extract_coin_symbol(text, tracked_symbols),
                    "influencer_handle": author,
                    "engagement_score": engagement,
                    "sentiment_compound": float(sentiment),
                    "created_at": created_at,
                }
            )

    return posts, warnings


def _upsert_social_posts(db: Session, posts: list[dict[str, Any]]) -> tuple[int, int]:
    inserted = 0
    updated = 0

    if not posts:
        return inserted, updated

    by_source: dict[str, list[dict[str, Any]]] = {}
    for post in posts:
        by_source.setdefault(str(post["source"]), []).append(post)

    for source, source_posts in by_source.items():
        post_ids = [str(item["post_id"]) for item in source_posts]
        existing_rows = (
            db.query(SocialPost)
            .filter(and_(SocialPost.source == source, SocialPost.post_id.in_(post_ids)))
            .all()
        )
        existing_by_id = {row.post_id: row for row in existing_rows}

        for item in source_posts:
            existing = existing_by_id.get(str(item["post_id"]))
            if existing is None:
                db.add(SocialPost(**item))
                inserted += 1
                continue

            existing.author = str(item["author"])
            existing.context = str(item["context"])
            existing.text = str(item["text"])
            existing.coin_symbol = str(item["coin_symbol"])
            existing.influencer_handle = str(item["influencer_handle"])
            existing.engagement_score = int(item["engagement_score"])
            existing.sentiment_compound = float(item["sentiment_compound"])
            existing.created_at = item["created_at"]
            updated += 1

    db.commit()
    return inserted, updated


def _export_posts_to_csv(posts: list[dict[str, Any]], output_dir: str) -> str | None:
    target_dir = Path(output_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    file_path = target_dir / f"social_posts_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    fieldnames = [
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

    with file_path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        for row in posts:
            serializable_row = dict(row)
            created_at = serializable_row.get("created_at")
            if isinstance(created_at, datetime):
                serializable_row["created_at"] = created_at.isoformat()
            writer.writerow(serializable_row)

    return str(file_path)


async def fetch_and_store_social_data(db: Session, settings: Settings, payload: SocialFetchRequest) -> SocialIngestionResult:
    tracked_symbols = {symbol for (symbol,) in db.query(Coin.symbol).all()}
    analyzer = SentimentIntensityAnalyzer()
    warnings: list[str] = []

    twitter_queries = payload.twitter_queries or settings.twitter_queries
    reddit_subreddits = payload.reddit_subreddits or settings.reddit_subreddits

    twitter_posts: list[dict[str, Any]] = []
    reddit_posts: list[dict[str, Any]] = []

    if payload.include_twitter:
        twitter_posts, twitter_warnings = await _fetch_twitter_posts(
            queries=twitter_queries,
            limit=payload.twitter_limit,
            tracked_symbols=tracked_symbols,
            analyzer=analyzer,
            accounts_db=settings.twitter_accounts_db,
        )
        warnings.extend(twitter_warnings)

    if payload.include_reddit:
        reddit_posts, reddit_warnings = _fetch_reddit_posts(
            subreddits=reddit_subreddits,
            limit=payload.reddit_limit,
            tracked_symbols=tracked_symbols,
            analyzer=analyzer,
            settings=settings,
        )
        warnings.extend(reddit_warnings)

    combined_posts = twitter_posts + reddit_posts

    inserted = 0
    updated = 0
    if payload.store_in_db:
        inserted, updated = _upsert_social_posts(db, combined_posts)

    csv_path = _export_posts_to_csv(combined_posts, settings.social_csv_dir) if payload.export_csv else None

    response = SocialFetchResponse(
        fetched_twitter=len(twitter_posts),
        fetched_reddit=len(reddit_posts),
        inserted_db=inserted,
        updated_db=updated,
        csv_path=csv_path,
        warnings=warnings,
    )

    return SocialIngestionResult(response=response, posts=combined_posts)


def list_social_posts(db: Session, limit: int = 100, source: str | None = None) -> list[SocialPost]:
    query = db.query(SocialPost)
    if source:
        query = query.filter(SocialPost.source == source.lower())
    return query.order_by(SocialPost.created_at.desc()).limit(limit).all()
