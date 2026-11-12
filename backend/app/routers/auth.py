from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from ..db import db_dep
from ..schemas import Login, Register, RoleUpdate, TermsMetadata, TokenOut
from ..security import create_token, current_user, hash_password, require_role, verify_password
from ..services.audit import audit

router = APIRouter(prefix="/api/auth", tags=["auth"])

CURRENT_TERMS_VERSION = "2026-11-v1"


@router.get("/terms", response_model=TermsMetadata)
async def get_terms_metadata():
    """Return active Terms and Conditions metadata and status."""
    return TermsMetadata(
        version=CURRENT_TERMS_VERSION,
        effective_date="2026-11-12",
        title="SentinMail Platform Terms and Conditions",
        status="Draft - Requires Legal Review",
        privacy_policy_status="Separate Privacy Policy required prior to public launch",
    )


@router.post("/register", status_code=201)
async def register(body: Register, db=Depends(db_dep)):
    if not body.terms_accepted:
        raise HTTPException(400, "You must review and agree to the Terms and Conditions to create an account.")
    role = body.role if body.role in ("viewer", "analyst") else "analyst"
    accepted_version = body.terms_version or CURRENT_TERMS_VERSION
    accepted_time = datetime.now(timezone.utc)
    doc = {
        "_id": uuid4().hex,
        "email": body.email.lower(),
        "name": body.name,
        "role": role,
        "password_hash": hash_password(body.password),
        "terms_accepted": True,
        "terms_version": accepted_version,
        "terms_accepted_at": accepted_time,
        "created_at": accepted_time,
    }
    try:
        await db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(409, "An account with this email already exists.")
    await audit(db, doc["email"], "register", doc["_id"], {"terms_version": accepted_version})
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
