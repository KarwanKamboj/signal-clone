import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket

logger = logging.getLogger("websocket_manager")


class ConnectionManager:
    def __init__(self):
        # Map user_id to set of active WebSocket instances
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected. Active connections: {len(self.active_connections[user_id])}")

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected.")

    def is_user_online(self, user_id: str) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    async def send_personal_message(self, user_id: str, event_type: str, data: dict):
        """Send message to a specific user on all their active connections."""
        if user_id in self.active_connections:
            payload = json.dumps({"type": event_type, "data": data})
            dead_sockets = set()
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(payload)
                except Exception as e:
                    logger.error(f"Error sending message to {user_id}: {e}")
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.disconnect(user_id, ws)

    async def broadcast_to_users(self, user_ids: List[str], event_type: str, data: dict, exclude_user_id: str = None):
        """Send message to a list of users (e.g., members of a group or direct chat)."""
        for uid in user_ids:
            if exclude_user_id and uid == exclude_user_id:
                continue
            await self.send_personal_message(uid, event_type, data)


ws_manager = ConnectionManager()
