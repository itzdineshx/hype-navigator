import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import InfluenceMetric, Influencer
from app.schemas import InfluenceMetricOut, InfluencerOut

router = APIRouter()


@router.get("/top", response_model=list[InfluencerOut])
def get_top_influencers(
    category: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[InfluencerOut]:
    query = db.query(Influencer)
    if category:
        query = query.filter(Influencer.category == category)
    return query.order_by(Influencer.impact_score.desc()).limit(limit).all()


@router.get("/metrics", response_model=list[InfluenceMetricOut])
def get_influence_metrics(db: Session = Depends(get_db)) -> list[InfluenceMetricOut]:
    return db.query(InfluenceMetric).all()


@router.get("/radar")
def get_influence_radar(db: Session = Depends(get_db)) -> list[dict[str, int | str | float]]:
    influencers = db.query(Influencer).order_by(Influencer.impact_score.desc()).limit(15).all()
    if not influencers:
        return []

    points = []
    max_followers = max(influencer.followers for influencer in influencers)

    for index, influencer in enumerate(influencers, start=1):
        # Blend impact/trust/activity into a single quality score for node emphasis.
        normalized_activity = min(100.0, float(influencer.posts_24h) / 2.4)
        quality_score = round(
            (float(influencer.impact_score) * 0.5)
            + (float(influencer.trust_score) * 0.35)
            + (normalized_activity * 0.15),
            1,
        )

        # Spread nodes radially by trust and angle by rank to avoid overlap.
        radius = 18.0 + ((100.0 - float(influencer.trust_score)) / 100.0) * 30.0
        angle = (index * 360.0 / max(1, len(influencers))) + (index * 7.0)
        x = 50.0 + (radius * math.cos(math.radians(angle)))
        y = 50.0 + (radius * math.sin(math.radians(angle)))

        followers_ratio = float(influencer.followers) / max(1.0, float(max_followers))
        node_size = int(round(18.0 + (followers_ratio * 20.0) + (float(influencer.impact_score) / 10.0)))

        if quality_score >= 85:
            tier = "alpha"
        elif quality_score >= 70:
            tier = "core"
        elif quality_score >= 55:
            tier = "watch"
        else:
            tier = "risk"

        points.append(
            {
                "id": influencer.id,
                "name": influencer.name,
                "handle": influencer.handle,
                "x": round(max(8.0, min(92.0, x)), 2),
                "y": round(max(8.0, min(92.0, y)), 2),
                "size": max(16, min(46, node_size)),
                "impact_score": influencer.impact_score,
                "trust_score": influencer.trust_score,
                "posts_24h": influencer.posts_24h,
                "followers": influencer.followers,
                "category": influencer.category,
                "quality_score": quality_score,
                "tier": tier,
            }
        )
    return points
