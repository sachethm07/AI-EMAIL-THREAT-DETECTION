from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect

from ..db import db_dep, get_db
from ..security import current_user, user_from_token
from ..services.alerts import hub

router = APIRouter(tags=["alerts"])


@router.get("/api/alerts")
async def list_alerts(unread: bool = False, limit: int = Query(50, ge=1, le=200), _=Depends(current_user), db=Depends(db_dep)):
    filt = {"read": False} if unread else {}
    return [{**{k: v for k, v in a.items() if k != "_id"}, "id": a["_id"]} async for a in db.alerts.find(filt).sort("ts", -1).limit(limit)]


@router.post("/api/alerts/{alert_id}/read")
async def mark_read(alert_id: str, _=Depends(current_user), db=Depends(db_dep)):
    if not (await db.alerts.update_one({"_id": alert_id}, {"$set": {"read": True}})).matched_count:
        raise HTTPException(404, "Alert not found.")
    return {"id": alert_id, "read": True}


@router.websocket("/ws/alerts")
async def alerts_socket(ws: WebSocket, token: str = Query(...)):
    if not await user_from_token(token, get_db()):
        await ws.close(code=4401)
        return
    await hub.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        hub.disconnect(ws)
