from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=5, description='Headline or article text to classify')


class PredictResponse(BaseModel):
    label: str = Field(..., description='Prediction label: FAKE, REAL, or UNCERTAIN')
    confidence: float = Field(..., ge=0.0, le=1.0, description='Confidence score between 0 and 1')
    explanation: str = Field(..., description='Explanation describing why the model returned this label')


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    mongodb_connected: bool


class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=6, max_length=200)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=6, max_length=200)


class AuthUser(BaseModel):
    full_name: str
    email: str
    profile_image: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: AuthUser


class UpdateProfilePictureRequest(BaseModel):
    profile_image: str = Field(..., min_length=20, max_length=2_000_000)


class MessageResponse(BaseModel):
    message: str


class TestimonialCreateRequest(BaseModel):
    text: str = Field(..., min_length=8, max_length=400)


class TestimonialItem(BaseModel):
    id: str
    name: str
    handle: str
    date: str
    text: str
    image: str | None = None


class TestimonialListResponse(BaseModel):
    items: list[TestimonialItem]
