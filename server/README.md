# VeriLens Backend (FastAPI)

This folder contains the backend API for fake-news detection.

## 1) Setup

```bash
cd server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 2) Configure

Copy `.env.example` to `.env` and edit values if needed.

```bash
copy .env.example .env
```

Important values:

- `HOST` and `PORT` for API server
- `CORS_ORIGINS` for frontend origin(s)
- `MONGODB_URI` and `MONGODB_DB_NAME` for MongoDB auth storage
- `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES` for access tokens
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for hosted profile images (optional)
- `MODEL_PATH` and `VECTORIZER_PATH` if you have trained artifacts

## 3) Run API

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## 4) Endpoints

- `GET /health` : API status, model load status and MongoDB connectivity
- `POST /predict` : classify fake news from text payload
- `POST /auth/signup` : create account in MongoDB and return JWT
- `POST /auth/login` : authenticate user and return JWT
- `PATCH /auth/profile-picture` : update profile image (uploads to Cloudinary if configured)
- `GET /testimonials` : list latest testimonials from MongoDB
- `POST /testimonials` : create testimonial for logged-in user

Auth signup request:

```json
{
  "full_name": "Vinay Kumar",
  "email": "vinay@example.com",
  "password": "securepassword"
}
```

Auth response:

```json
{
  "access_token": "<jwt-token>",
  "token_type": "bearer",
  "user": {
    "full_name": "Vinay Kumar",
    "email": "vinay@example.com"
  }
}
```

Request:

```json
{ "text": "Breaking news headline or article text" }
```

Response:

```json
{
  "label": "FAKE",
  "confidence": 0.86,
  "explanation": "Likely fake: sensational or low-credibility wording detected by fallback rules."
}
```

## Notes

- If `models/model.joblib` and `models/vectorizer.joblib` exist, the API uses them.
- Otherwise, it uses a fallback keyword-based predictor so the frontend demo still works.
- The frontend auth pages call this API using `VITE_API_BASE_URL` (default `http://127.0.0.1:8000`).
