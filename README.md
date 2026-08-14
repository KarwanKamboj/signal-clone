# Signal Messenger Clone — Fullstack SDE Assignment

A fullstack real-time messaging application built to replicate Signal's core workflows, design language, and dual-pane chat interface.

---

## Live Demo

- **Frontend:** [https://signal-clone-woad-eta.vercel.app](https://signal-clone-woad-eta.vercel.app)
- **Backend API Docs:** [https://signal-clone-rmax.onrender.com/docs](https://signal-clone-rmax.onrender.com/docs)

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
- Python 3.11+
- Windows Command Prompt or PowerShell

### 1. Backend Setup & Run

From the project root directory, navigate to the backend:

```cmd
cd backend
```

Create and activate a Python virtual environment:

```cmd
py -3.11 -m venv venv
venv\Scripts\Activate
```

Install dependencies:

```cmd
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Start the FastAPI server:

```cmd
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

> Demo users, contacts, chats, and messages are seeded automatically when the backend starts.

---

### 2. Frontend Setup & Run

Open a second terminal from the project root directory:

```cmd
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Quick Test Credentials

Select any quick profile on login or enter phone number with OTP `123456`:

| Name               | Phone Number    | Username   | Role / About               |
| :----------------- | :-------------- | :--------- | :------------------------- |
| **Rohit**          | `+919876543210` | `rohit`    | Fullstack Lead             |
| **Karwan**         | `+919811223344` | `karwan`   | Backend Systems Engineer   |
| **Ananya Sharma**  | `+919822334455` | `ananya_s` | Frontend Engineer          |
| **Karan Malhotra** | `+919833445566` | `karan_m`  | Systems Architect & DevOps |

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
