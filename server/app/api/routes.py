from datetime import datetime
import re
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

from fastapi import APIRouter
from fastapi import HTTPException, status
from fastapi import Header
from pymongo.errors import DuplicateKeyError
from app.config import settings

try:
    import stripe
except Exception:  # pragma: no cover
    stripe = None

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
    UrlAnalyzeRequest,
    UpdateProfilePictureRequest,
    StripeCheckoutSessionRequest,
    StripeCheckoutSessionResponse,
    StripeCheckoutConfirmRequest,
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


def _extract_text_from_html(html: str) -> str:
    # Remove scripts/styles and collapse whitespace for a compact analysis input.
    no_script = re.sub(r'<script[\s\S]*?</script>', ' ', html, flags=re.IGNORECASE)
    no_style = re.sub(r'<style[\s\S]*?</style>', ' ', no_script, flags=re.IGNORECASE)
    no_tags = re.sub(r'<[^>]+>', ' ', no_style)
    cleaned = re.sub(r'\s+', ' ', no_tags).strip()
    return cleaned


def _normalize_subscription_plan(plan_id: str | None) -> str:
    normalized = (plan_id or '').strip().lower()
    if normalized == 'pro':
        return 'pro'
    if normalized in {'ultra', 'enterprise', 'custom'}:
        return 'ultra'
    return 'starter'


def _extract_mapping_value(raw: object, key: str) -> str | None:
    if isinstance(raw, dict):
        value = raw.get(key)
    else:
        value = getattr(raw, key, None)

    if isinstance(value, str):
        return value
    return None


def _is_disposable_email_domain(email: str) -> bool:
    parts = email.rsplit('@', 1)
    if len(parts) != 2:
        return True

    domain = parts[1].strip().lower()
    blocked_domains = {
        'example.com',
        'mailinator.com',
        'tempmail.com',
        'temp-mail.org',
        'guerrillamail.com',
        'yopmail.com',
        '10minutemail.com',
        'fakeinbox.com',
        'trashmail.com',
        'sharklasers.com',
    }

    if domain in blocked_domains:
        return True

    blocked_fragments = ('mailinator', 'tempmail', 'yopmail', '10minutemail', 'guerrillamail')
    return any(fragment in domain for fragment in blocked_fragments)


@router.get('/', tags=['system'])
def root() -> dict[str, str]:
    return {
        'status': 'ok',
        'message': 'VeriLens API is running.',
        'health': '/health',
        'docs': '/docs',
    }


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


@router.post('/analyze-url', response_model=PredictResponse, tags=['prediction'])
def analyze_url(payload: UrlAnalyzeRequest) -> PredictResponse:
    raw_url = payload.url.strip()
    if not (raw_url.startswith('http://') or raw_url.startswith('https://')):
        raw_url = f'https://{raw_url}'

    try:
        request = Request(
            raw_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (VeriLens URL Analyzer)',
                'Accept': 'text/html,application/xhtml+xml',
            },
        )
        with urlopen(request, timeout=10) as response:
            content_type = response.headers.get('Content-Type', '')
            if 'text/html' not in content_type:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail='URL does not point to an HTML page.',
                )
            html = response.read(2_000_000).decode('utf-8', errors='ignore')
    except HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Failed to fetch URL (HTTP {exc.code}).',
        )
    except URLError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Unable to fetch the provided URL.',
        )

    text = _extract_text_from_html(html)
    if len(text) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Not enough readable text found on this page.',
        )

    # Limit payload to keep inference fast and stable.
    result = predictor.predict(text[:6000])
    return PredictResponse(
        label=result.label,
        confidence=result.confidence,
        explanation=f'{result.explanation} Source: {raw_url}',
    )


@router.post('/billing/create-checkout-session', response_model=StripeCheckoutSessionResponse, tags=['billing'])
def create_checkout_session(
    payload: StripeCheckoutSessionRequest,
    authorization: str | None = Header(default=None),
) -> StripeCheckoutSessionResponse:
    email = _get_email_from_auth_header(authorization)

    if stripe is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Stripe package is not installed on server.',
        )

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Stripe is not configured. Missing STRIPE_SECRET_KEY.',
        )

    normalized_plan_id = payload.plan_id.strip().lower()
    if normalized_plan_id not in {'pro', 'ultra', 'enterprise', 'custom'}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Unsupported plan_id. Allowed: pro, ultra, enterprise, custom.',
        )

    if normalized_plan_id == 'pro':
        stripe_price_id = settings.STRIPE_PRICE_ID_PRO
    else:
        stripe_price_id = settings.STRIPE_PRICE_ID_CUSTOM

    if not stripe_price_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Stripe is not configured for the selected plan.',
        )

    if not stripe_price_id.startswith('price_'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid Stripe price id. Use a value that starts with price_.',
        )

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        session = stripe.checkout.Session.create(
            mode='subscription',
            line_items=[
                {
                    'price': stripe_price_id,
                    'quantity': 1,
                }
            ],
            metadata={
                'plan_id': normalized_plan_id,
                'user_email': email,
            },
            subscription_data={
                'metadata': {
                    'plan_id': normalized_plan_id,
                    'user_email': email,
                }
            },
            client_reference_id=email,
            customer_email=email,
            success_url=f'{settings.CLIENT_APP_URL}/profile?checkout=success&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{settings.CLIENT_APP_URL}/#pricing',
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Failed to create Stripe checkout session: {exc}',
        )

    checkout_url = getattr(session, 'url', None)
    if not checkout_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Stripe checkout URL was not returned.',
        )

    return StripeCheckoutSessionResponse(
        session_id=session.id,
        checkout_url=checkout_url,
    )


@router.post('/billing/confirm-checkout-session', response_model=AuthResponse, tags=['billing'])
def confirm_checkout_session(
    payload: StripeCheckoutConfirmRequest,
    authorization: str | None = Header(default=None),
) -> AuthResponse:
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='MongoDB is not connected. Check backend database configuration.',
        )

    email = _get_email_from_auth_header(authorization)

    if stripe is None or not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Stripe is not configured on server.',
        )

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        session = stripe.checkout.Session.retrieve(payload.session_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid checkout session: {exc}',
        )

    if getattr(session, 'status', None) != 'complete':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Checkout session is not complete yet.',
        )

    customer_email = getattr(session, 'customer_email', None)
    client_reference_id = getattr(session, 'client_reference_id', None)
    customer_details = getattr(session, 'customer_details', None)
    details_email = None
    if isinstance(customer_details, dict):
        details_email = customer_details.get('email')
    elif customer_details is not None:
        details_email = getattr(customer_details, 'email', None)
    checkout_email = customer_email or details_email
    if checkout_email and checkout_email.lower() != email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Checkout session does not belong to this user.',
        )
    if client_reference_id and client_reference_id.lower() != email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Checkout session does not belong to this user.',
        )

    metadata = getattr(session, 'metadata', {}) or {}
    plan_id = _normalize_subscription_plan(metadata.get('plan_id'))

    if plan_id == 'starter':
        # Fallback to line item price mapping when metadata is absent.
        try:
            line_items = stripe.checkout.Session.list_line_items(payload.session_id, limit=5)
            items = getattr(line_items, 'data', []) or []
            for item in items:
                price = getattr(item, 'price', None)
                if isinstance(price, dict):
                    price_id = price.get('id')
                else:
                    price_id = getattr(price, 'id', None)

                if price_id == settings.STRIPE_PRICE_ID_PRO:
                    plan_id = 'pro'
                    break
                if price_id == settings.STRIPE_PRICE_ID_CUSTOM:
                    plan_id = 'ultra'
                    break
        except Exception:
            # Keep starter fallback if Stripe line-items lookup fails.
            pass

    users_collection.update_one(
        {'email': email},
        {
            '$set': {
                'subscription_plan': plan_id,
                'stripe_customer_id': getattr(session, 'customer', None),
                'updated_at': datetime.utcnow(),
            }
        },
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
            subscription_plan=user_doc.get('subscription_plan', 'starter'),
        ),
    )


@router.post('/auth/signup', response_model=AuthResponse, tags=['auth'])
def signup(payload: SignupRequest) -> AuthResponse:
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='MongoDB is not connected. Check backend database configuration.',
        )

    email = payload.email.strip().lower()

    if _is_disposable_email_domain(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Please use a valid non-disposable email address.',
        )

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
        'subscription_plan': 'starter',
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
        user=AuthUser(
            full_name=user_doc['full_name'],
            email=email,
            profile_image=None,
            subscription_plan='starter',
        ),
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
            subscription_plan=user_doc.get('subscription_plan', 'starter'),
        ),
    )


@router.get('/auth/me', response_model=AuthResponse, tags=['auth'])
def get_current_user(authorization: str | None = Header(default=None)) -> AuthResponse:
    if users_collection is None:
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

    token = create_access_token(subject=email)
    return AuthResponse(
        access_token=token,
        token_type='bearer',
        user=AuthUser(
            full_name=user_doc.get('full_name', ''),
            email=email,
            profile_image=user_doc.get('profile_image'),
            subscription_plan=user_doc.get('subscription_plan', 'starter'),
        ),
    )


@router.post('/billing/sync-subscription-plan', response_model=AuthResponse, tags=['billing'])
def sync_subscription_plan(authorization: str | None = Header(default=None)) -> AuthResponse:
    if users_collection is None:
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

    if stripe is None or not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Stripe is not configured on server.',
        )

    stripe.api_key = settings.STRIPE_SECRET_KEY

    resolved_plan = _normalize_subscription_plan(user_doc.get('subscription_plan'))
    stripe_customer_id = user_doc.get('stripe_customer_id')

    try:
        customer_ids: list[str] = []
        if isinstance(stripe_customer_id, str) and stripe_customer_id.strip():
            customer_ids.append(stripe_customer_id.strip())
        else:
            customers = stripe.Customer.list(email=email, limit=10)
            customer_items = getattr(customers, 'data', []) or []
            for customer in customer_items:
                customer_id = _extract_mapping_value(customer, 'id')
                if customer_id:
                    customer_ids.append(customer_id)

        for customer_id in customer_ids:
            if resolved_plan in {'pro', 'ultra'}:
                break

            subscriptions = stripe.Subscription.list(customer=customer_id, status='all', limit=30)
            sub_items = getattr(subscriptions, 'data', []) or []

            for sub in sub_items:
                sub_status = _extract_mapping_value(sub, 'status')
                if sub_status not in {'active', 'trialing', 'past_due', 'unpaid'}:
                    continue

                sub_metadata = getattr(sub, 'metadata', {}) or {}
                sub_plan = _normalize_subscription_plan(_extract_mapping_value(sub_metadata, 'plan_id'))
                if sub_plan in {'pro', 'ultra'}:
                    resolved_plan = sub_plan
                    stripe_customer_id = customer_id
                    break

                items_obj = getattr(sub, 'items', {}) or {}
                price_items = getattr(items_obj, 'data', []) or []

                for item in price_items:
                    price_obj = getattr(item, 'price', {}) or {}
                    price_id = _extract_mapping_value(price_obj, 'id')

                    if price_id == settings.STRIPE_PRICE_ID_CUSTOM:
                        resolved_plan = 'ultra'
                        stripe_customer_id = customer_id
                        break
                    if price_id == settings.STRIPE_PRICE_ID_PRO:
                        resolved_plan = 'pro'
                        stripe_customer_id = customer_id
                        break

                if resolved_plan in {'pro', 'ultra'}:
                    break

        # Fallback: resolve from most recent completed checkout sessions metadata.
        if resolved_plan == 'starter':
            for customer_id in customer_ids:
                sessions = stripe.checkout.Session.list(customer=customer_id, limit=20)
                session_items = getattr(sessions, 'data', []) or []

                for session in session_items:
                    status_value = _extract_mapping_value(session, 'status')
                    if status_value != 'complete':
                        continue

                    metadata_obj = getattr(session, 'metadata', {}) or {}
                    session_plan = _normalize_subscription_plan(_extract_mapping_value(metadata_obj, 'plan_id'))
                    if session_plan in {'pro', 'ultra'}:
                        resolved_plan = session_plan
                        stripe_customer_id = customer_id
                        break

                if resolved_plan in {'pro', 'ultra'}:
                    break
    except Exception:
        # Keep current stored plan when Stripe sync fails.
        pass

    users_collection.update_one(
        {'email': email},
        {
            '$set': {
                'subscription_plan': resolved_plan,
                'stripe_customer_id': stripe_customer_id,
                'updated_at': datetime.utcnow(),
            }
        },
    )

    updated_user = users_collection.find_one({'email': email})
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found.',
        )

    token = create_access_token(subject=email)
    return AuthResponse(
        access_token=token,
        token_type='bearer',
        user=AuthUser(
            full_name=updated_user.get('full_name', ''),
            email=email,
            profile_image=updated_user.get('profile_image'),
            subscription_plan=updated_user.get('subscription_plan', 'starter'),
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
            subscription_plan=user_doc.get('subscription_plan', 'starter'),
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
