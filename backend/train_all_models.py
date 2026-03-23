from app.db.base import Base
from app.db.init_db import seed_database
from app.db.session import SessionLocal, engine
from app.services.model_training import train_all_models


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        result = train_all_models(db)
    finally:
        db.close()

    print("Training complete. Saved artifacts:")
    for model_name, metadata in result.items():
        artifact = metadata.get("artifact", "n/a")
        print(f"- {model_name}: {artifact}")


if __name__ == "__main__":
    main()