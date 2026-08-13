from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, and_, desc
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Conversation, ConversationMember, Message, MessageReaction
from ..schemas import (
    ConversationResponse,
    DirectConversationCreate,
    GroupCreate,
    AddGroupMemberSchema,
    MessageCreate,
    MessageResponse,
    MessageReactionCreate,
    MessageReactionResponse,
    UserResponse
)
from ..auth import get_current_user
from ..websocket_manager import ws_manager

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


def format_conversation_response(conv: Conversation, current_user_id: str, db: Session) -> dict:
    """Helper to format conversation response with display title, avatar, last message, and unread count."""
    memberships = db.query(ConversationMember).filter(ConversationMember.conversation_id == conv.id).all()
    member_user_ids = [m.user_id for m in memberships]

    display_title = conv.name
    display_avatar = conv.avatar_url

    if not conv.is_group:
        # Find other participant in 1-on-1 chat
        other_member = [m for m in memberships if m.user_id != current_user_id]
        if other_member:
            other_user = db.query(User).filter(User.id == other_member[0].user_id).first()
            if other_user:
                display_title = other_user.display_name
                display_avatar = other_user.avatar_url
        elif len(memberships) == 1:
            # Self chat
            user = db.query(User).filter(User.id == current_user_id).first()
            if user:
                display_title = f"{user.display_name} (Note to Self)"
                display_avatar = user.avatar_url

    # Get last message
    last_msg = db.query(Message).filter(Message.conversation_id == conv.id).order_by(desc(Message.created_at)).first()

    # Calculate unread count (messages sent by others with status != 'read')
    unread_count = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.sender_id != current_user_id,
        Message.status != "read"
    ).count()

    return {
        "id": conv.id,
        "is_group": conv.is_group,
        "name": conv.name,
        "avatar_url": conv.avatar_url,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "members": memberships,
        "last_message": last_msg,
        "unread_count": unread_count,
        "display_title": display_title or "Conversation",
        "display_avatar": display_avatar
    }


@router.get("", response_model=List[ConversationResponse])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all active conversations for the current user, ordered by recent activity."""
    member_records = db.query(ConversationMember).filter(ConversationMember.user_id == current_user.id).all()
    conv_ids = [m.conversation_id for m in member_records]

    conversations = db.query(Conversation).filter(
        Conversation.id.in_(conv_ids)
    ).order_by(desc(Conversation.updated_at)).all()

    result = [format_conversation_response(conv, current_user.id, db) for conv in conversations]
    return result


@router.post("/direct", response_model=ConversationResponse)
def get_or_create_direct_conversation(
    payload: DirectConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get or create 1-on-1 direct conversation with another user."""
    target_user = db.query(User).filter(User.id == payload.target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Check existing direct conversation
    user1_convs = db.query(ConversationMember.conversation_id).filter(ConversationMember.user_id == current_user.id).subquery()
    user2_convs = db.query(ConversationMember.conversation_id).filter(ConversationMember.user_id == target_user.id).subquery()

    common_conv = db.query(Conversation).filter(
        Conversation.is_group == False,
        Conversation.id.in_(user1_convs),
        Conversation.id.in_(user2_convs)
    ).first()

    if common_conv:
        return format_conversation_response(common_conv, current_user.id, db)

    # Create new 1-on-1 conversation
    new_conv = Conversation(is_group=False)
    db.add(new_conv)
    db.flush()

    m1 = ConversationMember(conversation_id=new_conv.id, user_id=current_user.id, role="admin")
    m2 = ConversationMember(conversation_id=new_conv.id, user_id=target_user.id, role="admin")
    db.add_all([m1, m2])

    # Add initial system message
    system_msg = Message(
        conversation_id=new_conv.id,
        sender_id=None,
        content="🔒 Safety number verified. Messages and calls are end-to-end encrypted.",
        message_type="system",
        status="read"
    )
    db.add(system_msg)

    db.commit()
    db.refresh(new_conv)

    return format_conversation_response(new_conv, current_user.id, db)


@router.post("/group", response_model=ConversationResponse)
def create_group_conversation(
    payload: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new group conversation."""
    avatar_url = payload.avatar_url or f"https://api.dicebear.com/7.x/shapes/svg?seed={payload.name}"

    group_conv = Conversation(
        is_group=True,
        name=payload.name,
        avatar_url=avatar_url
    )
    db.add(group_conv)
    db.flush()

    # Admin member (creator)
    db.add(ConversationMember(conversation_id=group_conv.id, user_id=current_user.id, role="admin"))

    # Add invited members
    all_member_ids = set(payload.member_user_ids)
    all_member_ids.discard(current_user.id)

    for uid in all_member_ids:
        user_exists = db.query(User).filter(User.id == uid).first()
        if user_exists:
            db.add(ConversationMember(conversation_id=group_conv.id, user_id=uid, role="member"))

    # Add initial system message
    system_msg = Message(
        conversation_id=group_conv.id,
        sender_id=None,
        content=f"Group '{payload.name}' created by {current_user.display_name}",
        message_type="system",
        status="read"
    )
    db.add(system_msg)

    db.commit()
    db.refresh(group_conv)

    # Notify all members via WebSocket
    response_data = format_conversation_response(group_conv, current_user.id, db)
    return response_data


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: str,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch message history for a conversation and mark received unread messages as read."""
    # Check membership
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    # Mark unread messages as read
    unread_messages = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.status != "read"
    ).all()

    if unread_messages:
        for msg in unread_messages:
            msg.status = "read"
        db.commit()

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).offset(offset).limit(limit).all()

    return messages


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message in a conversation and broadcast to active members via WebSockets."""
    # Check membership
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    new_msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=payload.content,
        message_type=payload.message_type or "text",
        media_url=payload.media_url,
        file_name=payload.file_name,
        reply_to_id=payload.reply_to_id,
        status="sent",
        is_disappearing=payload.is_disappearing or False,
        expires_in_seconds=payload.expires_in_seconds
    )
    db.add(new_msg)

    # Update conversation timestamp
    conv.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(new_msg)

    # Prepare broadcast payload
    all_members = db.query(ConversationMember).filter(ConversationMember.conversation_id == conversation_id).all()
    member_user_ids = [m.user_id for m in all_members]

    msg_data = {
        "id": new_msg.id,
        "conversation_id": new_msg.conversation_id,
        "sender_id": new_msg.sender_id,
        "sender": {
            "id": current_user.id,
            "display_name": current_user.display_name,
            "avatar_url": current_user.avatar_url,
            "phone_number": current_user.phone_number,
            "username": current_user.username,
            "is_online": True,
            "last_seen": current_user.last_seen.isoformat() if current_user.last_seen else None,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        },
        "content": new_msg.content,
        "message_type": new_msg.message_type,
        "media_url": new_msg.media_url,
        "file_name": new_msg.file_name,
        "reply_to_id": new_msg.reply_to_id,
        "status": new_msg.status,
        "is_disappearing": new_msg.is_disappearing,
        "expires_in_seconds": new_msg.expires_in_seconds,
        "created_at": new_msg.created_at.isoformat(),
        "reactions": []
    }

    # Real-time WebSocket notification to all members
    await ws_manager.broadcast_to_users(
        user_ids=member_user_ids,
        event_type="new_message",
        data=msg_data
    )

    return new_msg


@router.post("/messages/{message_id}/reactions", response_model=MessageReactionResponse)
async def add_message_reaction(
    message_id: str,
    payload: MessageReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add or update emoji reaction on a message."""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Remove existing reaction by same user if any
    db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == current_user.id
    ).delete()

    reaction = MessageReaction(
        message_id=message_id,
        user_id=current_user.id,
        emoji=payload.emoji
    )
    db.add(reaction)
    db.commit()
    db.refresh(reaction)

    # Notify conversation members via WebSocket
    all_members = db.query(ConversationMember).filter(ConversationMember.conversation_id == message.conversation_id).all()
    member_user_ids = [m.user_id for m in all_members]

    await ws_manager.broadcast_to_users(
        user_ids=member_user_ids,
        event_type="reaction",
        data={
            "id": reaction.id,
            "message_id": message_id,
            "conversation_id": message.conversation_id,
            "user_id": current_user.id,
            "emoji": reaction.emoji,
            "user": {
                "id": current_user.id,
                "display_name": current_user.display_name
            }
        }
    )

    return reaction


@router.post("/{conversation_id}/members", response_model=ConversationResponse)
def add_group_member(
    conversation_id: str,
    payload: AddGroupMemberSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a member to an existing group (Admin only)."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.is_group == True).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Group conversation not found")

    current_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not current_member or current_member.role != "admin":
        raise HTTPException(status_code=403, detail="Only group admins can add members")

    new_user = db.query(User).filter(User.id == payload.user_id).first()
    if not new_user:
        raise HTTPException(status_code=404, detail="User to add not found")

    existing = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == payload.user_id
    ).first()
    if not existing:
        db.add(ConversationMember(
            conversation_id=conversation_id,
            user_id=payload.user_id,
            role=payload.role or "member"
        ))

        # Add system log message
        system_msg = Message(
            conversation_id=conversation_id,
            sender_id=None,
            content=f"{new_user.display_name} was added to the group by {current_user.display_name}",
            message_type="system",
            status="read"
        )
        db.add(system_msg)
        db.commit()

    return format_conversation_response(conv, current_user.id, db)


@router.delete("/{conversation_id}/members/{user_id}", response_model=ConversationResponse)
def remove_group_member(
    conversation_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a member from group (Admin or leaving member)."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.is_group == True).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Group conversation not found")

    current_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not current_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    # Allow if current user is admin OR current user is removing themselves
    if current_member.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Only admins can remove other members")

    target_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == user_id
    ).first()

    if target_member:
        removed_user = db.query(User).filter(User.id == user_id).first()
        db.delete(target_member)

        # Add system log message
        removed_name = removed_user.display_name if removed_user else "A member"
        action_text = "left the group" if user_id == current_user.id else f"was removed by {current_user.display_name}"
        system_msg = Message(
            conversation_id=conversation_id,
            sender_id=None,
            content=f"{removed_name} {action_text}",
            message_type="system",
            status="read"
        )
        db.add(system_msg)
        db.commit()

    return format_conversation_response(conv, current_user.id, db)
