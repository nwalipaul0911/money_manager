import asyncio
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        conns = self.connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self.connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, message: dict[str, Any]) -> None:
        dead: list[WebSocket] = []
        for ws in self.connections.get(user_id, []):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(user_id, ws)


manager = ConnectionManager()
_main_loop: asyncio.AbstractEventLoop | None = None


def set_event_loop(loop: asyncio.AbstractEventLoop) -> None:
    global _main_loop
    _main_loop = loop


async def broadcast_data_changed(user_ids: set[str]) -> None:
    for uid in user_ids:
        await manager.send_to_user(uid, {"type": "data_changed"})


def notify_data_changed(user_ids: set[str]) -> None:
    if _main_loop is None or not user_ids:
        return
    asyncio.run_coroutine_threadsafe(broadcast_data_changed(user_ids), _main_loop)
