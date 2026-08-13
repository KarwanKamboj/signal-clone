from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Contact
from ..schemas import UserResponse, ContactCreate, ContactResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/search", response_model=List[UserResponse])
def search_users(
    query: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search registered users by phone number, username, or display name."""
    search_term = f"%{query.strip()}%"
    users = db.query(User).filter(
        User.id != current_user.id,
        or_(
            User.phone_number.ilike(search_term),
            User.username.ilike(search_term),
            User.display_name.ilike(search_term)
        )
    ).limit(20).all()
    return users


@router.get("/contacts", response_model=List[ContactResponse])
def get_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get contact list of the current user."""
    contacts = db.query(Contact).filter(Contact.user_id == current_user.id).all()
    return contacts


@router.post("/contacts", response_model=ContactResponse)
def add_contact(
    payload: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a user to contact list by user_id, phone_number, or username."""
    target_user = None
    if payload.contact_user_id:
        target_user = db.query(User).filter(User.id == payload.contact_user_id).first()
    elif payload.phone_number:
        target_user = db.query(User).filter(User.phone_number == payload.phone_number).first()
    elif payload.username:
        target_user = db.query(User).filter(User.username == payload.username).first()

    if not target_user:
        raise HTTPException(status_code=44, detail="Target user not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a contact")

    existing = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.contact_user_id == target_user.id
    ).first()
    if existing:
        return existing

    contact = Contact(
        user_id=current_user.id,
        contact_user_id=target_user.id,
        nickname=payload.nickname
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}")
def delete_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a contact from contact list."""
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.user_id == current_user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete(contact)
    db.commit()
    return {"success": True, "message": "Contact removed"}
