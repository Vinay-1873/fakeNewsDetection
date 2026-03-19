from __future__ import annotations

from typing import Any

from pymongo import MongoClient
from pymongo.collection import Collection

from app.config import settings

mongo_error: str | None = None
mongo_connected = False
client: MongoClient[Any] | None = None
users_collection: Collection[Any] | None = None
testimonials_collection: Collection[Any] | None = None

try:
    client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=3000)
    client.admin.command('ping')
    database = client[settings.MONGODB_DB_NAME]
    users_collection = database['users']
    testimonials_collection = database['testimonials']
    users_collection.create_index('email', unique=True)
    testimonials_collection.create_index('created_at')
    testimonials_collection.create_index('email')
    mongo_connected = True
except Exception as exc:  # pragma: no cover
    mongo_error = str(exc)
