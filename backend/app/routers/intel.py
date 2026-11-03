from fastapi import APIRouter, Depends, Query

from ..db import db_dep
from ..schemas import IocIn
from ..security import require_role
from ..services.audit import audit

router = APIRouter(prefix="/api/iocs", tags=["threat-intel"])


@router.post("", status_code=201)
async def add_ioc(body: IocIn, admin=Depends(require_role("admin")), db=Depends(db_dep)):
    value = body.value.strip().lower()
    await db.iocs.update_one({"type": body.type, "value": value},
                             {"$set": {"severity": body.severity, "source": body.source}}, upsert=True)
    await audit(db, admin["email"], "add_ioc", value, {"type": body.type})
    return {"type": body.type, "value": value, "severity": body.severity}


@router.get("")
async def list_iocs(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
                    _=Depends(require_role("analyst", "admin")), db=Depends(db_dep)):
    return [d async for d in db.iocs.find({}, {"_id": 0}).skip(skip).limit(limit)]


@router.delete("", status_code=204)
async def delete_ioc(type: str, value: str, admin=Depends(require_role("admin")), db=Depends(db_dep)):
    await db.iocs.delete_one({"type": type, "value": value.strip().lower()})
    await audit(db, admin["email"], "delete_ioc", value.lower(), {"type": type})
