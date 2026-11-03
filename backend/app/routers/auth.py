from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from ..db import db_dep
from ..schemas import Login, Register, RoleUpdate, TokenOut
from ..security import create_token, current_user, hash_password, require_role, verify_password
from ..services.audit import audit

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=201)
async def register(body: Register, db=Depends(db_dep)):
    role = body.role if body.role in ("viewer", "analyst") else "analyst"
    doc = {"_id": uuid4().hex, "email": body.email.lower(), "name": body.name, "role": role,
           "password_hash": hash_password(body.password), "created_at": datetime.now(timezone.utc)}
    try:
        await db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(409, "An account with this email already exists.")
    await audit(db, doc["email"], "register", doc["_id"])
    return {"email": doc["email"], "name": doc["name"], "role": doc["role"]}


@router.post("/login", response_model=TokenOut)
async def login(body: Login, db=Depends(db_dep)):
    user = await db.users.find_one({"email": body.email.lower()})
    ok = bool(user) and not user.get("disabled") and verify_password(body.password, user["password_hash"])
    await audit(db, body.email.lower(), "login_ok" if ok else "login_failed")
    if not ok:
        raise HTTPException(401, "Email or password is incorrect.")
    return TokenOut(access_token=create_token(user["email"], user["role"]), role=user["role"])


@router.get("/me")
async def me(user=Depends(current_user)):
    return {"email": user["email"], "name": user["name"], "role": user["role"]}


@router.get("/users")
async def users(_=Depends(require_role("admin")), db=Depends(db_dep)):
    return [{"email": u["email"], "name": u["name"], "role": u["role"], "disabled": u.get("disabled", False)}
            async for u in db.users.find({}, {"password_hash": 0})]


@router.patch("/users/{email}/role")
async def set_role(email: str, body: RoleUpdate, admin=Depends(require_role("admin")), db=Depends(db_dep)):
    res = await db.users.update_one({"email": email.lower()}, {"$set": {"role": body.role}})
    if not res.matched_count:
        raise HTTPException(404, "No user with that email.")
    await audit(db, admin["email"], "set_role", email.lower(), {"role": body.role})
    return {"email": email.lower(), "role": body.role}
