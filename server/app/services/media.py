from __future__ import annotations

try:
    import cloudinary
    import cloudinary.uploader
except Exception:  # pragma: no cover
    cloudinary = None

from app.config import settings

cloudinary_enabled = all(
    [
        settings.CLOUDINARY_CLOUD_NAME,
        settings.CLOUDINARY_API_KEY,
        settings.CLOUDINARY_API_SECRET,
    ]
)

if cloudinary_enabled and cloudinary is not None:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload_profile_image(image_data: str) -> str:
    """Upload profile image to Cloudinary when configured, otherwise return incoming data."""
    if not cloudinary_enabled or cloudinary is None:
        return image_data

    result = cloudinary.uploader.upload(
        image_data,
        folder=settings.CLOUDINARY_PROFILE_FOLDER,
        resource_type='image',
        overwrite=True,
    )
    return str(result.get('secure_url', image_data))
