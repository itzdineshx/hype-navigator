# Hype Navigator Backend (FastAPI)

This backend provides a complete REST API for the Hype Navigator crypto dashboard.

## Tech stack

- FastAPI
- SQLAlchemy 2.x
- SQLite (default, local file)
- Pydantic v2

## 1) Create virtual environment

### PowerShell

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## 2) Install dependencies

```powershell
pip install -r requirements.txt
```

## 3) Configure environment

```powershell
copy .env.example .env
```

Edit `.env` if needed.

## 4) Run API

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 5) Train and store all ML models

```powershell
cd backend
python train_all_models.py
```

This writes model artifacts to `backend/ml_artifacts`.

API docs:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Base URL

`http://localhost:8000/api/v1`

## Main endpoints

- `GET /health`
- `GET /dashboard/summary`
- `GET /dashboard/trending?limit=10`
- `GET /dashboard/trend-chart?symbol=DOGE&limit=40`
- `GET /coins`
- `GET /coins/{symbol}`
- `GET /coins/{symbol}/alerts`
- `GET /coins/{symbol}/influencers`
- `GET /alerts?severity=critical&status=active`
- `POST /alerts`
- `PATCH /alerts/{alert_id}/status`
- `GET /influence/top`
- `GET /influence/metrics`
- `GET /influence/radar`
- `POST /models/train-all`
- `GET /replay/events?symbol=PEPE`

## Notes

- On first startup, the app auto-creates tables and seeds sample crypto data.
- Default DB file is `backend/hype_navigator.db`.
- CORS is enabled for Vite dev hosts on port 8080.
- `GET /coins/{symbol}` now enriches coin details with live DexScreener market data.
- If DexScreener is unavailable, the endpoint falls back to local database values.
- `POST /models/train-all` trains VADER calibration, trend detector, price predictor, trust score regressor, anomaly detector, and influencer graph ranking, then saves artifacts to `backend/ml_artifacts`.
