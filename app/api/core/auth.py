"""Azure AD JWT token validation for FastAPI."""

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from functools import lru_cache
from typing import Any

from core.config import get_settings

security = HTTPBearer()


class User(BaseModel):
    """Authenticated user information extracted from JWT token."""

    email: str
    name: str | None = None
    oid: str  # Azure AD object ID


@lru_cache(maxsize=1)
def get_jwks_url() -> str:
    """Get the JWKS URL for Azure AD token validation."""
    settings = get_settings()
    return f"https://login.microsoftonline.com/{settings.azure_ad_tenant_id}/discovery/v2.0/keys"


@lru_cache(maxsize=1)
def get_issuer() -> str:
    """Get the expected issuer for Azure AD tokens."""
    settings = get_settings()
    return f"https://login.microsoftonline.com/{settings.azure_ad_tenant_id}/v2.0"


async def get_jwks() -> dict[str, Any]:
    """Fetch JWKS from Azure AD."""
    async with httpx.AsyncClient() as client:
        response = await client.get(get_jwks_url())
        response.raise_for_status()
        return response.json()


def get_signing_key(token: str, jwks: dict[str, Any]) -> dict[str, Any]:
    """Extract the signing key from JWKS that matches the token's kid."""
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to find appropriate key",
    )


async def validate_token(token: str) -> dict[str, Any]:
    """Validate a JWT token against Azure AD JWKS."""
    settings = get_settings()

    try:
        jwks = await get_jwks()
        signing_key = get_signing_key(token, jwks)

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=settings.azure_ad_client_id,
            issuer=get_issuer(),
            options={"verify_at_hash": False},
        )

        return payload

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to fetch JWKS: {str(e)}",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """FastAPI dependency to get the current authenticated user from JWT token."""
    token = credentials.credentials
    payload = await validate_token(token)

    # Extract user information from token claims
    email = payload.get("preferred_username") or payload.get("email") or payload.get("upn")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain email claim",
        )

    return User(
        email=email,
        name=payload.get("name"),
        oid=payload.get("oid", ""),
    )


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
) -> User | None:
    """FastAPI dependency to optionally get the current user (returns None if not authenticated)."""
    if credentials is None:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
