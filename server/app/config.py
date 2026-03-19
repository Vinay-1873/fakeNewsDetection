import os

from dotenv import load_dotenv

load_dotenv()


def _split_csv(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(',') if item.strip()]


class Settings:
    APP_NAME = os.getenv('APP_NAME', 'VeriLens Fake News API')
    APP_VERSION = os.getenv('APP_VERSION', '1.0.0')
    APP_DESCRIPTION = os.getenv(
        'APP_DESCRIPTION',
        'Backend API for fake news detection using an ML model with fallback scoring.',
    )

    HOST = os.getenv('HOST', '127.0.0.1')
    PORT = int(os.getenv('PORT', '8000'))

    MODEL_PATH = os.getenv('MODEL_PATH', 'models/model.joblib')
    VECTORIZER_PATH = os.getenv('VECTORIZER_PATH', 'models/vectorizer.joblib')

    CORS_ORIGINS = _split_csv(
        os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')
    )

    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://127.0.0.1:27017')
    MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'verilens')

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'change-this-secret-in-production')
    JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
    JWT_EXPIRE_MINUTES = int(os.getenv('JWT_EXPIRE_MINUTES', '60'))

    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '')
    CLOUDINARY_PROFILE_FOLDER = os.getenv('CLOUDINARY_PROFILE_FOLDER', 'verilens/profiles')

    CLIENT_APP_URL = os.getenv('CLIENT_APP_URL', 'http://127.0.0.1:5173')
    STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
    STRIPE_PRICE_ID_PRO = os.getenv('STRIPE_PRICE_ID_PRO', '')
    STRIPE_PRICE_ID_CUSTOM = os.getenv('STRIPE_PRICE_ID_CUSTOM', '')


settings = Settings()
