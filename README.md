# Signal Messenger Clone — Fullstack SDE Assignment

A fullstack real-time messaging application built to replicate Signal's core workflows, design language, and dual-pane chat interface.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy ORM, Pydantic V2
- **Database**: SQLite (`signal_clone.db`)
- **Real-time**: Native WebSockets with connection manager & JWT authentication

```
                               ┌─────────────────────────┐
                               │   Next.js Client (3000) │
                               └──────────┬───┬──────────┘
                                          │   │
                                 HTTP REST│   │WebSockets
                                          ▼   ▼
                               ┌─────────────────────────┐
                               │   FastAPI Server (8000) │
                               └────────────┬────────────┘
                                            │ SQLAlchemy
                                            ▼
                               ┌─────────────────────────┐
                               │ SQLite (signal_clone.db)│
                               └─────────────────────────┘
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
- Node.js v18+ and npm
- Python 3.10+

### 1. Backend Setup & Run

Navigate to the `backend` directory:
```bash
cd backend
```

Create Python virtual environment and install dependencies:
```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
```

Seed initial database (Users, Contacts, Direct & Group Chats):
```bash
./venv/bin/python seed.py
```

Start the FastAPI server:
```bash
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Swagger Docs available at `http://localhost:8000/docs`*

---

### 2. Frontend Setup & Run

In a second terminal window, navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your web browser.

---

## 🧪 Quick Test Credentials

Select any quick profile on login or enter phone number with OTP `123456`:

| Name | Phone Number | Username | Role / About |
| :--- | :--- | :--- | :--- |
| **Rohit** | `+919876543210` | `rohit` | Fullstack Lead |
| **Karwan** | `+919811223344` | `karwan` | Backend Systems Engineer |
| **Ananya Sharma** | `+919822334455` | `ananya_s` | Frontend Engineer |
| **Karan Malhotra** | `+919833445566` | `karan_m` | Systems Architect & DevOps |

---

## ⚡ Core Features Implemented

1. **Authentication & Onboarding**: Phone number OTP verification, session persistence, display name & avatar setup.
2. **Contacts & Chat List**: Real-time conversation list, unread message count badges, last message previews, search & tab filters.
3. **1-on-1 Real-time Messaging**: WebSockets delivery, single/double checkmark read receipts, typing indicators.
4. **Group Messaging**: Group creation, member list, and Admin controls (add/remove members).
5. **Media & Bonus Features**: Image/file attachments, emoji reactions, quoted replies, dark/light theme switcher.
6. **Backend Test Suite**: Automated integration testing (`pytest backend/tests/test_api.py`).

---

## 📁 Repository Structure

```
Scaler Ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app & WebSocket handler
│   │   ├── models.py            # SQLAlchemy database schemas
│   │   ├── schemas.py           # Pydantic request/response validation
│   │   ├── database.py          # SQLite engine & session management
│   │   ├── auth.py              # JWT token issuance & verification
│   │   ├── websocket_manager.py # Bi-directional connection manager
│   │   └── routers/             # API routes (auth, users, conversations, media)
│   ├── seed.py                  # Database seeder script
│   └── tests/                   # Pytest test suite
└── frontend/
    ├── app/                     # Next.js App Router pages & layout
    ├── components/              # Signal UI components (Sidebar, ChatPane, Modals)
    └── lib/                     # API client, WebSocket hook & TypeScript types
```
