from typing import Any

import httpx

from app.core.config import get_settings


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _pair_rank(pair: dict[str, Any]) -> tuple[float, float, float]:
    liquidity = _to_float((pair.get("liquidity") or {}).get("usd")) or 0.0
    volume_h24 = _to_float((pair.get("volume") or {}).get("h24")) or 0.0
    price_usd = _to_float(pair.get("priceUsd")) or 0.0
    return (liquidity, volume_h24, price_usd)


def _normalize_chain_id(value: Any) -> str:
    return (str(value or "").strip() or "unknown").lower()


def _extract_profile_links(raw_profile: dict[str, Any]) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []

    for website in raw_profile.get("websites") or []:
        url = str(website.get("url") or "").strip()
        if url:
            links.append({"type": "website", "label": str(website.get("label") or "Website"), "url": url})

    for social in raw_profile.get("socials") or []:
        url = str(social.get("url") or "").strip()
        if url:
            links.append(
                {
                    "type": str(social.get("type") or "social"),
                    "label": str(social.get("label") or social.get("type") or "Social"),
                    "url": url,
                }
            )

    for link in raw_profile.get("links") or []:
        url = str(link.get("url") or "").strip()
        if url:
            links.append(
                {
                    "type": str(link.get("type") or "link"),
                    "label": str(link.get("label") or link.get("type") or "Link"),
                    "url": url,
                }
            )

    return links


def coin_emoji(symbol: str) -> str:
    symbol = symbol.upper().strip()
    emoji_map = {
        "BTC": "\U0001FA99",
        "ETH": "\U0001F4A0",
        "SOL": "\u2600\ufe0f",
        "DOGE": "\U0001F436",
        "PEPE": "\U0001F438",
        "SHIB": "\U0001F43A",
        "BONK": "\U0001F9B4",
        "WIF": "\U0001F9E2",
    }
    return emoji_map.get(symbol, "\U0001FA99")


def market_mood_emoji(change_24h: float, trust_score: int, hype_score: int) -> str:
    if change_24h >= 10 and trust_score >= 70:
        return "\U0001F680"
    if change_24h >= 3:
        return "\U0001F4C8"
    if change_24h <= -10:
        return "\u26A0\ufe0f"
    if change_24h <= -3:
        return "\U0001F4C9"
    if hype_score >= 80:
        return "\U0001F525"
    return "\U0001F9ED"


def _fetch_latest_token_profiles(timeout_seconds: float = 8.0) -> list[dict[str, Any]]:
    settings = get_settings()
    try:
        with httpx.Client(timeout=timeout_seconds) as client:
            response = client.get(settings.dexscreener_profile_url)
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError):
        return []

    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]

    if isinstance(payload, dict):
        if isinstance(payload.get("profiles"), list):
            return [item for item in payload["profiles"] if isinstance(item, dict)]
        if isinstance(payload.get("data"), list):
            return [item for item in payload["data"] if isinstance(item, dict)]

    return []


def _profile_payload(profile: dict[str, Any] | None) -> dict[str, Any] | None:
    if not profile:
        return None

    return {
        "chain_id": profile.get("chainId"),
        "token_address": profile.get("tokenAddress"),
        "icon": profile.get("icon"),
        "header": profile.get("header"),
        "description": profile.get("description"),
        "links": _extract_profile_links(profile),
    }


def _find_profile_for_pair(pair: dict[str, Any] | None, profiles: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not pair:
        return None

    base_token = pair.get("baseToken") or {}
    token_address = str(base_token.get("address") or "").lower()
    chain_id = _normalize_chain_id(pair.get("chainId"))

    if not token_address:
        return None

    for profile in profiles:
        profile_address = str(profile.get("tokenAddress") or "").lower()
        profile_chain = _normalize_chain_id(profile.get("chainId"))
        if profile_address == token_address and profile_chain == chain_id:
            return profile

    return None


def fetch_top_pairs_for_symbol(
    symbol: str,
    timeout_seconds: float = 8.0,
    limit: int = 5,
) -> list[dict[str, Any]]:
    symbol = symbol.upper().strip()
    if not symbol:
        return []

    try:
        settings = get_settings()
        with httpx.Client(timeout=timeout_seconds) as client:
            response = client.get(settings.dexscreener_search_url, params={"q": symbol})
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError):
        return []

    raw_pairs = payload.get("pairs") or []
    symbol_matches = []

    for pair in raw_pairs:
        base_symbol = ((pair.get("baseToken") or {}).get("symbol") or "").upper()
        if base_symbol == symbol:
            symbol_matches.append(pair)

    ranked_pairs = sorted(symbol_matches, key=_pair_rank, reverse=True)[: max(1, limit)]
    output: list[dict[str, Any]] = []

    for ranked_pair in ranked_pairs:
        output.append(
            {
                "chain_id": ranked_pair.get("chainId"),
                "dex_id": ranked_pair.get("dexId"),
                "pair_address": ranked_pair.get("pairAddress"),
                "url": ranked_pair.get("url"),
                "price_usd": _to_float(ranked_pair.get("priceUsd")),
                "price_change_h24": _to_float((ranked_pair.get("priceChange") or {}).get("h24")),
                "liquidity_usd": _to_float((ranked_pair.get("liquidity") or {}).get("usd")),
                "fdv": _to_float(ranked_pair.get("fdv")),
                "market_cap": _to_float(ranked_pair.get("marketCap")),
                "volume_h24": _to_float((ranked_pair.get("volume") or {}).get("h24")),
                "base_symbol": (ranked_pair.get("baseToken") or {}).get("symbol"),
                "base_name": (ranked_pair.get("baseToken") or {}).get("name"),
                "quote_symbol": (ranked_pair.get("quoteToken") or {}).get("symbol"),
                "labels": ranked_pair.get("labels") or [],
            }
        )

    return output


def fetch_realtime_coin_snapshot(symbol: str, timeout_seconds: float = 8.0) -> dict[str, Any]:
    top_pairs = fetch_top_pairs_for_symbol(symbol=symbol, timeout_seconds=timeout_seconds, limit=5)
    pair = top_pairs[0] if top_pairs else None
    profiles = _fetch_latest_token_profiles(timeout_seconds=timeout_seconds)
    matched_profile = _find_profile_for_pair(pair=pair, profiles=profiles)

    effective_change = _to_float((pair or {}).get("price_change_h24")) or 0.0
    return {
        "dex_pair": pair,
        "top_pairs": top_pairs,
        "dex_profile": _profile_payload(matched_profile),
        "emoji": coin_emoji(symbol),
        "market_emoji": market_mood_emoji(change_24h=effective_change, trust_score=65, hype_score=65),
    }


def fetch_top_pair_for_symbol(symbol: str, timeout_seconds: float = 8.0) -> dict[str, Any] | None:
    top_pairs = fetch_top_pairs_for_symbol(symbol=symbol, timeout_seconds=timeout_seconds, limit=1)
    return top_pairs[0] if top_pairs else None
