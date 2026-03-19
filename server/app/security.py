from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from fastapi import HTTPException, status
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=['pbkdf2_sha256'], deprecated='auto')


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str) -> str:
    expire_at = datetime.now(tz=timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {'sub': subject, 'exp': expire_at}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def get_subject_from_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired token.',
        ) from exc

    subject = payload.get('sub')
    if not isinstance(subject, str) or not subject.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid token payload.',
        )

    return subject
