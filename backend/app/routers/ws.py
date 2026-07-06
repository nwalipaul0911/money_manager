from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.auth import decode_access_token
from app.realtime import manager

router = APIRouter(tags=["realtime"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    user_id = decode_access_token(token)
    if not user_id:
        await websocket.close(code=4401)
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
