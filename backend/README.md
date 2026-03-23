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

## 6) Fetch social data (Twitter + Reddit) and store to DB/CSV

From project root:

```powershell
d:/Projects/Hackathon/hype-navigator/.venv/Scripts/python.exe backend/fetch_social_data.py
```

This command:

- Scrapes meme-coin mentions from Twitter/X using `twscrape`
- Fetches crypto subreddit posts using `praw`
- Stores results into local DB table `social_posts`
- Exports CSV to `backend/exports/social` (set `SOCIAL_CSV_DIR=./backend/exports/social` when running from project root)

Note: A CSV file is created even when zero posts are fetched, so you can verify the pipeline ran and inspect headers.

Optional args:

```powershell
d:/Projects/Hackathon/hype-navigator/.venv/Scripts/python.exe backend/fetch_social_data.py --twitter-limit 200 --reddit-limit 100
```

## 7) Score meme-coin dataset with sentiment + hype/trust analysis

If you have meme-coin history CSVs in `data/Meme Coin`, run:

```powershell
d:/Projects/Hackathon/hype-navigator/.venv/Scripts/python.exe backend/score_meme_coin_data.py
```

This computes per-coin:

- sentiment compound and sentiment score
- hype score and mentions proxy score
- trust score, risk level, prediction, confidence

It also:

- writes scored output CSV to `backend/exports/scored`
- updates local DB `coins` table with latest computed scores
- refreshes recent `trend_points` rows for charting

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
- `GET /coins/{symbol}/realtime`
- `GET /coins/{symbol}/alerts`
- `GET /coins/{symbol}/influencers`
- `GET /alerts?severity=critical&status=active`
- `POST /alerts`
- `PATCH /alerts/{alert_id}/status`
- `GET /influence/top`
- `GET /influence/metrics`
- `GET /influence/radar`
- `POST /social/fetch`
- `GET /social/posts?source=twitter&limit=100`
- `POST /models/train-all`
- `POST /models/score-meme-data`
- `GET /replay/events?symbol=PEPE`

## Social Ingestion (Twitter + Reddit)

This backend can ingest meme-coin social data from:

- Twitter/X via `twscrape` (no official API key required)
- Reddit via `praw` (requires Reddit app credentials)

### Twitter setup (twscrape)

Create and configure `TWITTER_ACCOUNTS_DB` (default: `./twscrape_accounts.db`) with valid X accounts using twscrape tooling. The `/social/fetch` endpoint reads from that accounts DB.

### Reddit setup (PRAW)

Set these env vars in `.env`:

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`

### Fetch + Store

Call:

```http
POST /api/v1/social/fetch
Content-Type: application/json

{
	"include_twitter": true,
	"include_reddit": true,
	"twitter_limit": 120,
	"reddit_limit": 60,
	"store_in_db": true,
	"export_csv": true
}
```

What it does:

- Fetches posts from configured Twitter queries and Reddit subreddits
- Computes VADER sentiment score (`sentiment_compound`)
- Stores posts in local DB table `social_posts`
- Optionally exports fetched rows to CSV in `SOCIAL_CSV_DIR`

## Notes

- On first startup, the app auto-creates tables and seeds sample crypto data.
- Default DB file is `backend/hype_navigator.db`.
- CORS is enabled for Vite dev hosts on port 8080.
- `GET /coins/{symbol}` now enriches coin details with live DexScreener market data.
- `GET /coins/{symbol}/realtime` returns live DexScreener top pairs, matched token profile data, and market/coin emojis.
- If DexScreener is unavailable, the endpoint falls back to local database values.
- `POST /models/train-all` trains VADER calibration, trend detector, price predictor, trust score regressor, anomaly detector, and influencer graph ranking, then saves artifacts to `backend/ml_artifacts`.
