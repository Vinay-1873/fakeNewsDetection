from datetime import datetime

from fastapi import APIRouter
from fastapi import HTTPException, status
from fastapi import Header
from pymongo.errors import DuplicateKeyError

from app.db import mongo_connected, testimonials_collection, users_collection
from app.schemas import (
    AuthResponse,
    AuthUser,
    HealthResponse,
    LoginRequest,
    MessageResponse,
    PredictRequest,
    PredictResponse,
    SignupRequest,
    TestimonialCreateRequest,
    TestimonialItem,
    TestimonialListResponse,
    UpdateProfilePictureRequest,
)
from app.security import create_access_token, get_subject_from_token, hash_password, verify_password
from app.services.media import upload_profile_image
from app.services.predictor import predictor

router = APIRouter()


def _to_handle(full_name: str) -> str:
    normalized = ''.join(ch for ch in full_name.lower() if ch.isalnum())
    return f'@{normalized}' if normalized else '@user'


def _format_date(value: datetime) -> str:
    return f'{value.strftime("%B")} {value.day}, {value.year}'


def _testimonial_from_doc(doc: dict) -> TestimonialItem:
    created_at = doc.get('created_at')
    if not isinstance(created_at, datetime):
        created_at = datetime.utcnow()

    return TestimonialItem(
        id=str(doc.get('_id', '')),
        name=doc.get('name', 'User'),
        handle=doc.get('handle', '@user'),
        date=_format_date(created_at),
        text=doc.get('text', ''),
        image=doc.get('image'),
    )


def _get_email_from_auth_header(authorization: str | None) -> str:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Missing bearer token.',
        )

    token = authorization.replace('Bearer ', '', 1).strip()
    return get_subject_from_token(token)


@router.get('/health', response_model=HealthResponse, tags=['system'])
def health_check() -> HealthResponse:
    return HealthResponse(
        status='ok',
        model_loaded=predictor.model_loaded,
        mongodb_connected=mongo_connected,
    )


@router.post('/predict', response_model=PredictResponse, tags=['prediction'])
def predict(payload: PredictRequest) -> PredictResponse:
    result = predictor.predict(payload.text)
    return PredictResponse(
        label=result.label,
        confidence=result.confidence,
        explanation=result.explanation,
    )


@router.post('/auth/signup', response_model=AuthResponse, tags=['auth'])
def signup(payload: SignupRequest) -> AuthResponse:
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='MongoDB is not connected. Check backend database configuration.',
        )

    email = payload.email.strip().lower()

    existing_user = users_collection.find_one({'email': email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='An account with this email already exists.',
        )

    user_doc = {
        'full_name': payload.full_name.strip(),
        'email': email,
        'password_hash': hash_password(payload.password),
    }

    try:
        users_collection.insert_one(user_doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='An account with this email already exists.',
        )

    token = create_access_token(subject=email)
    return AuthResponse(
        access_token=token,
        token_type='bearer',
        user=AuthUser(full_name=user_doc['full_name'], email=email, profile_image=None),
    )


@router.post('/auth/login', response_model=AuthResponse, tags=['auth'])
def login(payload: LoginRequest) -> AuthResponse:
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='MongoDB is not connected. Check backend database configuration.',
        )

    email = payload.email.strip().lower()
    user_doc = users_collection.find_one({'email': email})

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid email or password.',
        )

    if not verify_password(payload.password, user_doc.get('password_hash', '')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid email or password.',
        )

    token = create_access_token(subject=email)
    return AuthResponse(
        access_token=token,
        token_type='bearer',
        user=AuthUser(
            full_name=user_doc.get('full_name', ''),
            email=email,
            profile_image=user_doc.get('profile_image'),
        ),
    )


@router.patch('/auth/profile-picture', response_model=AuthResponse, tags=['auth'])
def update_profile_picture(
    payload: UpdateProfilePictureRequest,
    authorization: str | None = Header(default=None),
) -> AuthResponse:
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='MongoDB is not connected. Check backend database configuration.',
        )

    email = _get_email_from_auth_header(authorization)

    resolved_profile_image = upload_profile_image(payload.profile_image)

    users_collection.update_one(
        {'email': email},
        {'$set': {'profile_image': resolved_profile_image}},
    )

    user_doc = users_collection.find_one({'email': email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found.',
        )

    token = create_access_token(subject=email)
    return AuthResponse(
        access_token=token,
        token_type='bearer',
        user=AuthUser(
            full_name=user_doc.get('full_name', ''),
            email=email,
            profile_image=user_doc.get('profile_image'),
        ),
    )


@router.delete('/auth/delete-account', response_model=MessageResponse, tags=['auth'])
def delete_account(authorization: str | None = Header(default=None)) -> MessageResponse:
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='MongoDB is not connected. Check backend database configuration.',
        )

    email = _get_email_from_auth_header(authorization)
    result = users_collection.delete_one({'email': email})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found.',
        )

    if testimonials_collection is not None:
        testimonials_collection.delete_many({'email': email})

    return MessageResponse(message='Account deleted successfully.')


@router.get('/testimonials', response_model=TestimonialListResponse, tags=['testimonials'])
def get_testimonials() -> TestimonialListResponse:
    if testimonials_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='MongoDB is not connected. Check backend database configuration.',
        )

    docs = list(testimonials_collection.find().sort('created_at', -1).limit(30))
    items = [_testimonial_from_doc(doc) for doc in docs]
    return TestimonialListResponse(items=items)


@router.post('/testimonials', response_model=TestimonialItem, tags=['testimonials'])
def create_testimonial(
    payload: TestimonialCreateRequest,
    authorization: str | None = Header(default=None),
) -> TestimonialItem:
    if testimonials_collection is None or users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='MongoDB is not connected. Check backend database configuration.',
        )

    email = _get_email_from_auth_header(authorization)
    user_doc = users_collection.find_one({'email': email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found.',
        )

    created_at = datetime.utcnow()
    doc = {
        'email': email,
        'name': user_doc.get('full_name', 'User'),
        'handle': _to_handle(user_doc.get('full_name', 'user')),
        'text': payload.text.strip(),
        'image': user_doc.get('profile_image'),
        'created_at': created_at,
    }

    insert_result = testimonials_collection.insert_one(doc)
    doc['_id'] = insert_result.inserted_id
    return _testimonial_from_doc(doc)
