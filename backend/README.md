# SentinMail back end

Python 3.12, FastAPI, MongoDB (Motor), scikit-learn, NLTK. It covers the ten modules in the synopsis.

| Synopsis module | Code |
|---|---|
| Email input and parsing | `app/services/parser.py`, `POST /api/analyze`, `POST /api/analyze/upload`, `imap_ingest.py` |
| AI threat detection | `ml/train.py`, `app/services/ml_model.py`, `nlp.py` (TF-IDF + NLTK) |
| Header and spoofing analysis | `header_analysis.py` (SPF, DKIM, DMARC, mismatches, routing) |
| URL analysis | `url_analysis.py` |
| Attachment analysis | `attachments.py` (metadata and hashes only, nothing is opened) |
| IP geolocation | `geoip.py` (GeoLite2 database or an API) |
| Threat intelligence and scoring | `intel.py`, `scoring.py` (Low, Medium, High, Critical) |
| Digital forensics | `forensics.py` (hash-chained evidence), `audit.py` |
| Alerts | `alerts.py` (database, WebSocket, optional SMTP) |
| Dashboard and reports | `routers/analysis.py` (`/api/stats`), `routers/reports.py` |

## Run with Docker

```bash
cp .env.example .env        # set JWT_SECRET (32+ characters), ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up --build
```

API docs: http://localhost:8000/docs

## Run locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export JWT_SECRET=$(openssl rand -hex 32) ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=change-this-password
uvicorn app.main:app --reload       # needs MongoDB on localhost:27017
pytest -q
```

## Train the model

```bash
python -m ml.train --data data/sample_emails.csv
```

The bundled CSV has 24 rows and only checks that the pipeline runs. Train on a real labelled corpus
(`text`, `label` with legitimate, spam or phishing). The script compares Logistic Regression, Naive Bayes,
Random Forest and a linear SVM, reports accuracy, precision, recall, F1 and false-positive rate, and saves the best
one to `ml/model.joblib` plus `ml/model_metrics.json` for your report. Without a model file the API still
works, using language indicators only, and says so in the result (`ml.source`).

## Main endpoints

| Method and path | Role |
|---|---|
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | anyone / signed in |
| `PATCH /api/auth/users/{email}/role`, `GET /api/auth/users` | admin |
| `POST /api/analyze` (`{"raw_email": "..."}`), `POST /api/analyze/upload` (.eml) | analyst, admin |
| `GET /api/cases`, `GET /api/cases/{id}`, `GET /api/stats` | any signed-in user |
| `GET /api/cases/{id}/report?format=html\|json`, `GET /api/cases/{id}/evidence/verify` | any signed-in user |
| `GET /api/cases/{id}/raw`, `DELETE /api/cases/{id}` | analyst+admin / admin |
| `POST/GET/DELETE /api/iocs` (local blocklist) | admin / analyst+admin |
| `GET /api/alerts`, `WS /ws/alerts?token=<JWT>` | any signed-in user |

New accounts start as `viewer`. An admin promotes them to `analyst` or `admin`.

## Connecting the front end

Log in with `POST /api/auth/login`, keep the token in memory, and send `Authorization: Bearer <token>`.
Replace the in-browser `analyze()` in the front end with a call to `POST /api/analyze`. The response
has the same parts the page already shows (`score`, `level`, `factors`, `authentication`, `hops`, `urls`, `attachments`, `iocs`).
Add your front end's address to `CORS_ORIGINS`.

## Safety and privacy notes

- Only analyze mail you are authorized to examine. IMAP ingestion is off by default.
- Attachments are never executed or opened. Only name, type, size and hashes are recorded.
- Geolocation describes a server or network and is not attribution. The report says so.
- If `GEOIP_API_URL` is set, public IPs from headers are sent to that service. Use a local GeoLite2 file (`GEOIP_DB_PATH`) to avoid that.
- Set a long random `JWT_SECRET`, serve over HTTPS, and add rate limiting at your reverse proxy before exposing the API.
- The WebSocket takes the token in the URL, which can appear in proxy logs. Use short token lifetimes.
