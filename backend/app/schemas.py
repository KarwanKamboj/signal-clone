from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# Auth Schemas
class RequestOtpSchema(BaseModel):
    phone_number: str = Field(..., example="+1234567890")


class VerifyOtpSchema(BaseModel):
    phone_number: str
    otp: str
    display_name: Optional[str] = "Signal User"
    username: Optional[str] = None


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# User Schemas
class UserBase(BaseModel):
    phone_number: str
    username: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None
    about: Optional[str] = "Hey there! I am using Signal."


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    about: Optional[str] = None


class UserResponse(UserBase):
    id: str
    is_online: bool
    last_seen: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# Contact Schemas
class ContactCreate(BaseModel):
    contact_user_id: Optional[str] = None
    phone_number: Optional[str] = None
    username: Optional[str] = None
    nickname: Optional[str] = None


class ContactResponse(BaseModel):
    id: str
    user_id: str
    contact_user: UserResponse
    nickname: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Reaction Schemas
class MessageReactionCreate(BaseModel):
    emoji: str


class MessageReactionResponse(BaseModel):
    id: str
    message_id: str
    user_id: str
    emoji: str
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# Message Schemas
class MessageCreate(BaseModel):
    conversation_id: str
    content: str
    message_type: Optional[str] = "text"
    media_url: Optional[str] = None
    file_name: Optional[str] = None
    reply_to_id: Optional[str] = None
    is_disappearing: Optional[bool] = False
    expires_in_seconds: Optional[int] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: Optional[str]
    sender: Optional[UserResponse] = None
    content: str
    message_type: str
    media_url: Optional[str] = None
    file_name: Optional[str] = None
    reply_to_id: Optional[str] = None
    status: str
    is_disappearing: bool
    expires_in_seconds: Optional[int] = None
    created_at: datetime
    reactions: List[MessageReactionResponse] = []

    class Config:
        from_attributes = True


# Conversation Member Schemas
class ConversationMemberResponse(BaseModel):
    id: str
    conversation_id: str
    user_id: str
    role: str
    joined_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True


# Conversation Schemas
class DirectConversationCreate(BaseModel):
    target_user_id: str


class GroupCreate(BaseModel):
    name: str
    avatar_url: Optional[str] = None
    member_user_ids: List[str]


class AddGroupMemberSchema(BaseModel):
    user_id: str
    role: Optional[str] = "member"


class ConversationResponse(BaseModel):
    id: str
    is_group: bool
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    members: List[ConversationMemberResponse] = []
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    display_title: Optional[str] = None
    display_avatar: Optional[str] = None

    class Config:
        from_attributes = True


# WebSocket Event Schema
class WSEvent(BaseModel):
    type: str  # e.g., "message", "typing", "read_receipt", "reaction", "presence"
    data: dict
