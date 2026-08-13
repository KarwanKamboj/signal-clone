from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import RequestOtpSchema, VerifyOtpSchema, TokenSchema, UserResponse, UserUpdate
from ..auth import create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/request-otp")
def request_otp(payload: RequestOtpSchema, db: Session = Depends(get_db)):
    """
    Mocked OTP request endpoint.
    Returns success message and fixed OTP code '123456' for seamless testing.
    """
    # Check if user already exists or create draft
    phone = payload.phone_number.strip()
    return {
        "success": True,
        "message": "Verification OTP sent successfully",
        "mock_otp": "123456",
        "phone_number": phone
    }


@router.post("/verify-otp", response_model=TokenSchema)
def verify_otp(payload: VerifyOtpSchema, db: Session = Depends(get_db)):
    """
    Verify OTP and return JWT access token.
    Mock OTP is '123456'.
    """
    if payload.otp != "123456":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code. Please enter '123456' for mock verification."
        )

    phone = payload.phone_number.strip()
    user = db.query(User).filter(User.phone_number == phone).first()

    if not user:
        # Register new user
        display_name = payload.display_name or f"Signal User ({phone[-4:] if len(phone)>=4 else phone})"
        username = payload.username or f"user_{phone.replace('+', '').replace(' ', '')}"
        
        # Default Signal avatar generator URL
        avatar_url = f"https://api.dicebear.com/7.x/bottts/svg?seed={phone}"

        user = User(
            phone_number=phone,
            username=username,
            display_name=display_name,
            avatar_url=avatar_url,
            is_online=True,
            last_seen=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.is_online = True
        user.last_seen = datetime.utcnow()
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "phone_number": user.phone_number})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile information (display_name, username, avatar_url, about)."""
    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    if payload.username is not None:
        # Check uniqueness if username is changing
        if payload.username != current_user.username:
            existing = db.query(User).filter(User.username == payload.username).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username is already taken")
            current_user.username = payload.username
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.about is not None:
        current_user.about = payload.about

    db.commit()
    db.refresh(current_user)
    return current_user
