import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import Base, get_db

# Setup isolated test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_signal.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_root_status():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_auth_flow():
    # 1. Request OTP
    res_otp = client.post("/api/auth/request-otp", json={"phone_number": "+19998887777"})
    assert res_otp.status_code == 200
    assert res_otp.json()["mock_otp"] == "123456"

    # 2. Verify invalid OTP
    res_bad = client.post("/api/auth/verify-otp", json={"phone_number": "+19998887777", "otp": "000000"})
    assert res_bad.status_code == 400

    # 3. Verify valid OTP
    res_verify = client.post("/api/auth/verify-otp", json={
        "phone_number": "+19998887777",
        "otp": "123456",
        "display_name": "Test User",
        "username": "testuser"
    })
    assert res_verify.status_code == 200
    data = res_verify.json()
    assert "access_token" in data
    assert data["user"]["display_name"] == "Test User"


def test_conversations_and_messages():
    # Create User A
    u1 = client.post("/api/auth/verify-otp", json={"phone_number": "+1111111111", "otp": "123456", "display_name": "User One"}).json()
    token1 = u1["access_token"]
    user1_id = u1["user"]["id"]

    # Create User B
    u2 = client.post("/api/auth/verify-otp", json={"phone_number": "+2222222222", "otp": "123456", "display_name": "User Two"}).json()
    token2 = u2["access_token"]
    user2_id = u2["user"]["id"]

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 1. Create Direct Conversation
    direct_res = client.post("/api/conversations/direct", json={"target_user_id": user2_id}, headers=headers1)
    assert direct_res.status_code == 200
    conv_id = direct_res.json()["id"]

    # 2. Send Message from User 1
    msg_res = client.post(f"/api/conversations/{conv_id}/messages", json={
        "conversation_id": conv_id,
        "content": "Hello from User One!"
    }, headers=headers1)
    assert msg_res.status_code == 200
    assert msg_res.json()["content"] == "Hello from User One!"

    # 3. Fetch Messages from User 2
    history_res = client.get(f"/api/conversations/{conv_id}/messages", headers=headers2)
    assert history_res.status_code == 200
    messages = history_res.json()
    assert len(messages) >= 2  # System message + text message

    # 4. Create Group Conversation
    group_res = client.post("/api/conversations/group", json={
        "name": "Test Group",
        "member_user_ids": [user2_id]
    }, headers=headers1)
    assert group_res.status_code == 200
    assert group_res.json()["is_group"] is True
