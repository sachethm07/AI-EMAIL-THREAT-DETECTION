from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings
from .db import db_dep

bearer = HTTPBearer(auto_error=False)
ALGO = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def create_token(email: str, role: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": email, "role": role, "exp": exp}, settings.jwt_secret, algorithm=ALGO)


async def user_from_token(token: str, db):
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGO])
    except jwt.PyJWTError:
        return None
    user = await db.users.find_one({"email": payload.get("sub")}, {"password_hash": 0})
    return None if not user or user.get("disabled") else user


async def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    token: str | None = Query(None),
    db=Depends(db_dep),
):
    jwt_token = creds.credentials if creds else token
    user = await user_from_token(jwt_token, db) if jwt_token else None
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to continue.", headers={"WWW-Authenticate": "Bearer"})
    return user


async def optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    token: str | None = Query(None),
    db=Depends(db_dep),
):
    jwt_token = creds.credentials if creds else token
    if not jwt_token:
        return None
    return await user_from_token(jwt_token, db)


def require_role(*roles: str):
    async def dep(user=Depends(current_user)):
        if user["role"] not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Your role does not allow this action.")
        return user

    return dep
