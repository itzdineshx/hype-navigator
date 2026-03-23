from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.model_training import train_all_models

router = APIRouter()


@router.post("/train-all")
def train_models(db: Session = Depends(get_db)) -> dict[str, dict]:
    return train_all_models(db)