from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from statistics import mean, pstdev

import joblib
import networkx as nx
import numpy as np
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import IsolationForest, RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, r2_score
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from sqlalchemy.orm import Session

from app.models.entities import Alert, Coin, InfluenceMetric, Influencer, ReplayEvent, TrendPoint

ARTIFACT_DIR = Path(__file__).resolve().parents[2] / "ml_artifacts"


def _safe_float(value: float | int | None, default: float = 0.0) -> float:
    if value is None:
        return default
    return float(value)


def _persist_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)


def _build_vader_calibration(db: Session) -> dict[str, float | int]:
    analyzer = SentimentIntensityAnalyzer()
    texts: list[str] = []
    texts.extend([f"{item.title}. {item.message}" for item in db.query(Alert).all()])
    texts.extend([item.description for item in db.query(ReplayEvent).all()])

    if not texts:
        texts = ["Market is neutral"]

    compounds = [analyzer.polarity_scores(text)["compound"] for text in texts]
    lower = float(np.percentile(compounds, 33))
    upper = float(np.percentile(compounds, 67))

    artifact_path = ARTIFACT_DIR / "sentiment_vader_calibration.json"
    payload = {
        "model": "vader",
        "artifact": str(artifact_path),
        "sample_size": len(texts),
        "negative_threshold": lower,
        "positive_threshold": upper,
    }

    _persist_json(artifact_path, payload)
    return payload


def _trend_samples(db: Session) -> tuple[np.ndarray, np.ndarray]:
    points = db.query(TrendPoint).order_by(TrendPoint.coin_symbol.asc(), TrendPoint.ts.asc()).all()
    by_symbol: dict[str, list[TrendPoint]] = defaultdict(list)
    for point in points:
        by_symbol[point.coin_symbol].append(point)

    features: list[list[float]] = []
    labels: list[int] = []

    for series in by_symbol.values():
        mention_values = [item.mentions for item in series]
        series_mean = mean(mention_values)
        series_std = pstdev(mention_values) if len(mention_values) > 1 else 0.0
        for index in range(1, len(series)):
            current = series[index]
            previous = series[index - 1]
            mention_delta = current.mentions - previous.mentions
            price_return = (current.price - previous.price) / max(previous.price, 1e-9)
            is_spike = int(current.mentions > (series_mean + series_std))
            features.append([
                float(current.mentions),
                float(mention_delta),
                float(current.sentiment),
                float(price_return),
            ])
            labels.append(is_spike)

    if not features:
        return np.zeros((0, 4)), np.zeros((0,), dtype=int)

    return np.array(features, dtype=float), np.array(labels, dtype=int)


def _train_trend_detector(db: Session) -> dict[str, float | int | str]:
    X, y = _trend_samples(db)
    if X.shape[0] == 0:
        model = DummyClassifier(strategy="most_frequent")
        model.fit(np.array([[0.0, 0.0, 0.0, 0.0]]), np.array([0]))
        train_acc = 1.0
    else:
        unique_classes = np.unique(y)
        if unique_classes.shape[0] < 2:
            model = DummyClassifier(strategy="constant", constant=int(unique_classes[0]))
            model.fit(X, y)
        else:
            model = RandomForestClassifier(n_estimators=180, random_state=42)
            model.fit(X, y)
        train_acc = float(accuracy_score(y, model.predict(X)))

    artifact = ARTIFACT_DIR / "trend_spike_detector.joblib"
    artifact.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, artifact)

    return {
        "artifact": str(artifact),
        "samples": int(X.shape[0]),
        "train_accuracy": round(train_acc, 4),
    }


def _price_direction_samples(db: Session) -> tuple[np.ndarray, np.ndarray]:
    points = db.query(TrendPoint).order_by(TrendPoint.coin_symbol.asc(), TrendPoint.ts.asc()).all()
    coins = {coin.symbol: coin for coin in db.query(Coin).all()}
    by_symbol: dict[str, list[TrendPoint]] = defaultdict(list)
    for point in points:
        by_symbol[point.coin_symbol].append(point)

    X: list[list[float]] = []
    y: list[int] = []

    for symbol, series in by_symbol.items():
        coin = coins.get(symbol)
        hype = _safe_float(coin.hype_score if coin else None)
        trust = _safe_float(coin.trust_score if coin else None)
        for index in range(1, len(series) - 1):
            previous = series[index - 1]
            current = series[index]
            nxt = series[index + 1]
            mention_delta = current.mentions - previous.mentions
            price_return = (current.price - previous.price) / max(previous.price, 1e-9)
            target_up = int(nxt.price > current.price)
            X.append(
                [
                    float(current.mentions),
                    float(mention_delta),
                    float(current.sentiment),
                    float(price_return),
                    hype,
                    trust,
                ]
            )
            y.append(target_up)

    if not X:
        return np.zeros((0, 6)), np.zeros((0,), dtype=int)

    return np.array(X, dtype=float), np.array(y, dtype=int)


def _train_price_predictor(db: Session) -> dict[str, float | int | str]:
    X, y = _price_direction_samples(db)
    if X.shape[0] == 0:
        model = DummyClassifier(strategy="most_frequent")
        model.fit(np.array([[0.0, 0.0, 0.0, 0.0, 0.0, 0.0]]), np.array([0]))
        train_acc = 1.0
    else:
        unique_classes = np.unique(y)
        if unique_classes.shape[0] < 2:
            model = DummyClassifier(strategy="constant", constant=int(unique_classes[0]))
            model.fit(X, y)
        else:
            model = RandomForestClassifier(n_estimators=220, random_state=42)
            model.fit(X, y)
        train_acc = float(accuracy_score(y, model.predict(X)))

    artifact = ARTIFACT_DIR / "price_direction_predictor.joblib"
    artifact.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, artifact)

    return {
        "artifact": str(artifact),
        "samples": int(X.shape[0]),
        "train_accuracy": round(train_acc, 4),
    }


def _train_trust_regressor(db: Session) -> dict[str, float | int | str]:
    influencers = db.query(Influencer).all()
    metrics = db.query(InfluenceMetric).all()

    metric_map: dict[str, dict[str, int]] = defaultdict(dict)
    for metric in metrics:
        metric_map[metric.influencer_handle][metric.metric] = metric.value

    X: list[list[float]] = []
    y: list[float] = []

    for influencer in influencers:
        influencer_metrics = metric_map.get(influencer.handle, {})
        reach = _safe_float(influencer_metrics.get("reach"), default=0.0)
        activity = _safe_float(influencer_metrics.get("activity"), default=float(influencer.posts_24h))
        X.append(
            [
                float(influencer.followers),
                float(influencer.impact_score),
                float(influencer.posts_24h),
                reach,
                activity,
            ]
        )
        y.append(float(influencer.trust_score))

    if not X:
        X = [[0.0, 0.0, 0.0, 0.0, 0.0]]
        y = [0.0]

    X_arr = np.array(X, dtype=float)
    y_arr = np.array(y, dtype=float)

    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X_arr, y_arr)
    train_r2 = float(r2_score(y_arr, model.predict(X_arr))) if X_arr.shape[0] > 1 else 1.0

    artifact = ARTIFACT_DIR / "trust_score_regressor.joblib"
    artifact.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, artifact)

    return {
        "artifact": str(artifact),
        "samples": int(X_arr.shape[0]),
        "train_r2": round(train_r2, 4),
    }


def _train_anomaly_detector(db: Session) -> dict[str, float | int | str]:
    points = db.query(TrendPoint).order_by(TrendPoint.coin_symbol.asc(), TrendPoint.ts.asc()).all()
    by_symbol: dict[str, list[TrendPoint]] = defaultdict(list)
    for point in points:
        by_symbol[point.coin_symbol].append(point)

    rows: list[list[float]] = []
    for series in by_symbol.values():
        for index in range(1, len(series)):
            previous = series[index - 1]
            current = series[index]
            mention_delta = (current.mentions - previous.mentions) / max(previous.mentions, 1)
            price_delta = (current.price - previous.price) / max(previous.price, 1e-9)
            rows.append([float(current.mentions), float(mention_delta), float(price_delta), float(current.sentiment)])

    if not rows:
        rows = [[0.0, 0.0, 0.0, 0.0]]

    X = np.array(rows, dtype=float)
    contamination = 0.2 if X.shape[0] < 20 else 0.1
    model = IsolationForest(n_estimators=200, contamination=contamination, random_state=42)
    model.fit(X)
    anomaly_rate = float(np.mean(model.predict(X) == -1))

    artifact = ARTIFACT_DIR / "pump_dump_anomaly_detector.joblib"
    artifact.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, artifact)

    return {
        "artifact": str(artifact),
        "samples": int(X.shape[0]),
        "observed_anomaly_rate": round(anomaly_rate, 4),
    }


def _train_influencer_graph(db: Session) -> dict[str, str | int | list[dict[str, float | str]]]:
    influencers = db.query(Influencer).all()
    coins = db.query(Coin).all()
    if not influencers or not coins:
        payload: dict[str, str | int | list[dict[str, float | str]]] = {
            "artifact": str(ARTIFACT_DIR / "influencer_graph_analysis.json"),
            "nodes": 0,
            "edges": 0,
            "top_influencers": [],
        }
        _persist_json(ARTIFACT_DIR / "influencer_graph_analysis.json", payload)
        return payload

    graph = nx.Graph()
    for coin in coins:
        graph.add_node(f"coin::{coin.symbol}", kind="coin", symbol=coin.symbol)

    for influencer in influencers:
        influencer_node = f"influencer::{influencer.handle}"
        graph.add_node(influencer_node, kind="influencer", handle=influencer.handle)
        max_links = max(1, min(3, int(influencer.impact_score / 35) + 1))
        ranked_coins = sorted(coins, key=lambda item: item.hype_score, reverse=True)[:max_links]
        for coin in ranked_coins:
            weight = (influencer.impact_score * 0.5) + (influencer.trust_score * 0.3) + (coin.hype_score * 0.2)
            graph.add_edge(influencer_node, f"coin::{coin.symbol}", weight=round(weight, 4))

    pagerank = nx.pagerank(graph, alpha=0.85, weight="weight")
    influencer_scores: list[dict[str, float | str]] = []
    for influencer in influencers:
        node = f"influencer::{influencer.handle}"
        influencer_scores.append(
            {
                "handle": influencer.handle,
                "score": round(float(pagerank.get(node, 0.0)), 6),
            }
        )

    influencer_scores.sort(key=lambda item: float(item["score"]), reverse=True)
    payload = {
        "artifact": str(ARTIFACT_DIR / "influencer_graph_analysis.json"),
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
        "top_influencers": influencer_scores[:10],
    }
    _persist_json(ARTIFACT_DIR / "influencer_graph_analysis.json", payload)
    return payload


def train_all_models(db: Session) -> dict[str, dict]:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    sentiment = _build_vader_calibration(db)
    trend = _train_trend_detector(db)
    price = _train_price_predictor(db)
    trust = _train_trust_regressor(db)
    anomaly = _train_anomaly_detector(db)
    graph = _train_influencer_graph(db)

    return {
        "sentiment_analysis_vader": sentiment,
        "trend_detection_model": trend,
        "price_movement_model": price,
        "trust_score_model": trust,
        "pump_dump_anomaly_detector": anomaly,
        "influencer_graph_analysis": graph,
    }