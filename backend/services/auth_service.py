"""Auth0 authentication service"""
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import requests
from datetime import datetime

from config import settings
from database import get_db
from models import User

security = HTTPBearer()


def get_jwks():
    """Fetch Auth0 public keys for JWT verification"""
    jwks_url = f'https://{settings.auth0_domain}/.well-known/jwks.json'
    response = requests.get(jwks_url)
    response.raise_for_status()
    return response.json()


def verify_token(token: str) -> dict:
    """Verify Auth0 JWT token"""
    try:
        # Get public key from Auth0
        jwks = get_jwks()
        unverified_header = jwt.get_unverified_header(token)

        # Find the right key
        rsa_key = {}
        for key in jwks['keys']:
            if key['kid'] == unverified_header['kid']:
                rsa_key = {
                    'kty': key['kty'],
                    'kid': key['kid'],
                    'use': key['use'],
                    'n': key['n'],
                    'e': key['e']
                }
                break

        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find appropriate key")

        # Verify the token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=settings.auth0_algorithms,
            audience=settings.auth0_audience,
            issuer=f'https://{settings.auth0_domain}/'
        )

        return payload

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from Auth0 token"""
    token = credentials.credentials

    # Verify Auth0 token
    auth0_user = verify_token(token)

    # Get or create user in our database
    user = User.get_or_create_from_auth0(db, auth0_user)

    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()

    return user
