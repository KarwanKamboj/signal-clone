import json
import logging
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, SessionLocal
from .models import User, Message, ConversationMember
from .routers import auth, users, conversations, media
from .auth import get_user_from_token
from .websocket_manager import ws_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("signal_backend")

# Create Database tables on application startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Signal Clone API",
    description="Backend API and WebSocket real-time engine for Signal Messenger Clone",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(conversations.router)
app.include_router(media.router)


@app.get("/")
def root_status():
    return {
        "status": "online",
        "app": "Signal Messenger Clone Backend API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    """
    Main WebSocket endpoint for real-time messaging, typing indicators,
    presence status, and read/delivery receipts.
    """
    db: Session = SessionLocal()
    try:
        user = get_user_from_token(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_id = user.id
        await ws_manager.connect(user_id, websocket)

        # Mark user online in DB
        user.is_online = True
        user.last_seen = datetime.utcnow()
        db.commit()

        # Broadcast user online status
        contacts = db.query(User).all()
        all_user_ids = [u.id for u in contacts if u.id != user_id]
        await ws_manager.broadcast_to_users(
            user_ids=all_user_ids,
            event_type="presence",
            data={
                "user_id": user_id,
                "is_online": True,
                "last_seen": user.last_seen.isoformat()
            }
        )

        try:
            while True:
                data_text = await websocket.receive_text()
                try:
                    payload = json.loads(data_text)
                    event_type = payload.get("type")
                    data = payload.get("data", {})

                    if event_type == "typing":
                        # Forward typing indicator to chat members
                        conv_id = data.get("conversation_id")
                        is_typing = data.get("is_typing", True)
                        if conv_id:
                            members = db.query(ConversationMember).filter(
                                ConversationMember.conversation_id == conv_id
                            ).all()
                            member_ids = [m.user_id for m in members]

                            await ws_manager.broadcast_to_users(
                                user_ids=member_ids,
                                event_type="typing",
                                data={
                                    "conversation_id": conv_id,
                                    "user_id": user_id,
                                    "display_name": user.display_name,
                                    "is_typing": is_typing
                                },
                                exclude_user_id=user_id
                            )

                    elif event_type == "read_receipt":
                        # Mark messages in conversation as read
                        conv_id = data.get("conversation_id")
                        if conv_id:
                            unread_msgs = db.query(Message).filter(
                                Message.conversation_id == conv_id,
                                Message.sender_id != user_id,
                                Message.status != "read"
                            ).all()

                            if unread_msgs:
                                for m in unread_msgs:
                                    m.status = "read"
                                db.commit()

                                members = db.query(ConversationMember).filter(
                                    ConversationMember.conversation_id == conv_id
                                ).all()
                                member_ids = [m.user_id for m in members]

                                await ws_manager.broadcast_to_users(
                                    user_ids=member_ids,
                                    event_type="read_receipt",
                                    data={
                                        "conversation_id": conv_id,
                                        "read_by_user_id": user_id,
                                        "timestamp": datetime.utcnow().isoformat()
                                    }
                                )

                    elif event_type == "ping":
                        await websocket.send_text(json.dumps({"type": "pong", "data": {}}))

                except json.JSONDecodeError:
                    logger.warning("Received invalid JSON on WebSocket")

        except WebSocketDisconnect:
            ws_manager.disconnect(user_id, websocket)
            # Update user offline status if no active connections left
            if not ws_manager.is_user_online(user_id):
                user.is_online = False
                user.last_seen = datetime.utcnow()
                db.commit()

                await ws_manager.broadcast_to_users(
                    user_ids=all_user_ids,
                    event_type="presence",
                    data={
                        "user_id": user_id,
                        "is_online": False,
                        "last_seen": user.last_seen.isoformat()
                    }
                )

    finally:
        db.close()
