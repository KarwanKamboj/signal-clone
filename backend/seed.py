import os
import sys
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import User, Contact, Conversation, ConversationMember, Message, MessageReaction

def seed_db():
    print("🌱 Seeding database with rich mock data...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        now = datetime.now()

        # 1. Create 8 Realistic Dev Users
        users_data = [
            {
                "phone_number": "+919876543210",
                "username": "rohit",
                "display_name": "Rohit",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit",
                "about": "Fullstack SDE Lead | Building Scaler Assignment",
                "is_online": True
            },
            {
                "phone_number": "+919811223344",
                "username": "karwan",
                "display_name": "Karwan",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Karwan",
                "about": "Backend Systems & WebSockets",
                "is_online": True
            },
            {
                "phone_number": "+919822334455",
                "username": "ananya_s",
                "display_name": "Ananya Sharma",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya",
                "about": "UI/UX Specialist & Frontend Dev",
                "is_online": True
            },
            {
                "phone_number": "+919833445566",
                "username": "karan_m",
                "display_name": "Karan Malhotra",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Karan",
                "about": "DevOps & System Architecture",
                "is_online": False,
                "last_seen": now - timedelta(minutes=12)
            },
            {
                "phone_number": "+919844556677",
                "username": "priya_v",
                "display_name": "Priya Verma",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
                "about": "Fullstack Engineer & Testing",
                "is_online": False,
                "last_seen": now - timedelta(minutes=45)
            },
            {
                "phone_number": "+919855667788",
                "username": "siddharth_r",
                "display_name": "Siddharth Rao",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Siddharth",
                "about": "Security Architect & Cryptography",
                "is_online": True
            },
            {
                "phone_number": "+919866778899",
                "username": "vikram_s",
                "display_name": "Vikram Singh",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
                "about": "Product Lead @ Scaler",
                "is_online": False,
                "last_seen": now - timedelta(hours=3)
            },
            {
                "phone_number": "+911000000000",
                "username": "signal_bot",
                "display_name": "Signal Assistant",
                "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=SignalBot",
                "about": "Automated System Assistant",
                "is_online": True
            }
        ]

        users = {}
        for data in users_data:
            u = User(**data)
            db.add(u)
            db.flush()
            users[u.username] = u

        rohit = users["rohit"]
        karwan = users["karwan"]
        ananya = users["ananya_s"]
        karan = users["karan_m"]
        priya = users["priya_v"]
        sid = users["siddharth_r"]
        vikram = users["vikram_s"]
        bot = users["signal_bot"]

        # 2. Add Contacts Network
        contacts_pairs = [
            (rohit, karwan, "Karwan Backend"),
            (rohit, ananya, "Ananya UI Lead"),
            (rohit, karan, "Karan DevOps"),
            (rohit, priya, "Priya QA"),
            (rohit, sid, "Siddharth Security"),
            (rohit, vikram, "Vikram PM"),
            (rohit, bot, "Signal Bot"),
            (karwan, rohit, "Rohit Lead"),
            (karwan, ananya, "Ananya UI"),
            (karwan, sid, "Siddharth Sec"),
            (ananya, rohit, "Rohit Lead"),
            (ananya, priya, "Priya QA")
        ]
        for u1, u2, nick in contacts_pairs:
            db.add(Contact(user_id=u1.id, contact_user_id=u2.id, nickname=nick))

        # 3. 1-on-1 Chat: Rohit & Karwan
        c1 = Conversation(is_group=False, updated_at=now - timedelta(minutes=2))
        db.add(c1)
        db.flush()

        db.add_all([
            ConversationMember(conversation_id=c1.id, user_id=rohit.id, role="admin"),
            ConversationMember(conversation_id=c1.id, user_id=karwan.id, role="admin")
        ])

        m1_1 = Message(
            conversation_id=c1.id,
            sender_id=None,
            content="Safety number verified. Messages and calls are end-to-end encrypted.",
            message_type="system",
            status="read",
            created_at=now - timedelta(hours=5)
        )
        m1_2 = Message(
            conversation_id=c1.id,
            sender_id=rohit.id,
            content="Hey Karwan, is the FastAPI WebSocket endpoint working fine on local server?",
            message_type="text",
            status="read",
            created_at=now - timedelta(hours=3)
        )
        m1_3 = Message(
            conversation_id=c1.id,
            sender_id=karwan.id,
            content="Yes Rohit! Real-time typing indicators, read receipts, and message delivery are working smoothly.",
            message_type="text",
            reply_to_id=m1_2.id,
            status="read",
            created_at=now - timedelta(hours=1, minutes=45)
        )
        m1_4 = Message(
            conversation_id=c1.id,
            sender_id=rohit.id,
            content="Awesome. I have polished the dark theme UI in Next.js. Check it out!",
            message_type="text",
            status="read",
            created_at=now - timedelta(minutes=2)
        )
        db.add_all([m1_1, m1_2, m1_3, m1_4])
        db.flush()

        db.add(MessageReaction(message_id=m1_3.id, user_id=rohit.id, emoji="🔥"))

        # 4. 1-on-1 Chat: Rohit & Ananya Sharma
        c2 = Conversation(is_group=False, updated_at=now - timedelta(minutes=15))
        db.add(c2)
        db.flush()

        db.add_all([
            ConversationMember(conversation_id=c2.id, user_id=rohit.id, role="admin"),
            ConversationMember(conversation_id=c2.id, user_id=ananya.id, role="admin")
        ])

        m2_1 = Message(
            conversation_id=c2.id,
            sender_id=ananya.id,
            content="Hey Rohit, I just pushed the glassmorphism CSS components for the sidebar and chat pane.",
            message_type="text",
            status="read",
            created_at=now - timedelta(hours=2)
        )
        m2_2 = Message(
            conversation_id=c2.id,
            sender_id=rohit.id,
            content="Nice! The hover actions and emoji popovers feel so fluid.",
            message_type="text",
            reply_to_id=m2_1.id,
            status="read",
            created_at=now - timedelta(minutes=15)
        )
        db.add_all([m2_1, m2_2])
        db.flush()
        db.add(MessageReaction(message_id=m2_2.id, user_id=ananya.id, emoji="❤️"))

        # 5. 1-on-1 Chat: Rohit & Vikram Singh (PM)
        c3 = Conversation(is_group=False, updated_at=now - timedelta(hours=1))
        db.add(c3)
        db.flush()

        db.add_all([
            ConversationMember(conversation_id=c3.id, user_id=rohit.id, role="admin"),
            ConversationMember(conversation_id=c3.id, user_id=vikram.id, role="admin")
        ])

        m3_1 = Message(
            conversation_id=c3.id,
            sender_id=vikram.id,
            content="Hi Rohit, please verify that all requirements from the Scaler SDE assignment sheet are covered.",
            message_type="text",
            status="read",
            created_at=now - timedelta(hours=4)
        )
        m3_2 = Message(
            conversation_id=c3.id,
            sender_id=rohit.id,
            content="All core & bonus features are implemented: Auth, Contacts, WebSockets, Group Admin controls, File Attachments, and Pytest coverage.",
            message_type="text",
            status="read",
            created_at=now - timedelta(hours=1)
        )
        db.add_all([m3_1, m3_2])
        db.flush()

        # 6. Group Chat 1: Scaler Engineering Core 🚀
        g1 = Conversation(
            is_group=True,
            name="Scaler Engineering Core 🚀",
            avatar_url="https://api.dicebear.com/7.x/identicon/svg?seed=ScalerEngineeringCore",
            updated_at=now - timedelta(minutes=5)
        )
        db.add(g1)
        db.flush()

        db.add_all([
            ConversationMember(conversation_id=g1.id, user_id=rohit.id, role="admin"),
            ConversationMember(conversation_id=g1.id, user_id=karwan.id, role="member"),
            ConversationMember(conversation_id=g1.id, user_id=ananya.id, role="member"),
            ConversationMember(conversation_id=g1.id, user_id=karan.id, role="member"),
            ConversationMember(conversation_id=g1.id, user_id=priya.id, role="member"),
            ConversationMember(conversation_id=g1.id, user_id=sid.id, role="member")
        ])

        gm1_1 = Message(
            conversation_id=g1.id,
            sender_id=None,
            content="Rohit created group 'Scaler Engineering Core 🚀'",
            message_type="system",
            status="read",
            created_at=now - timedelta(days=2)
        )
        gm1_2 = Message(
            conversation_id=g1.id,
            sender_id=karwan.id,
            content="FastAPI backend setup complete. SQLite schema handles users, contacts, messages, and reactions cleanly.",
            message_type="text",
            status="read",
            created_at=now - timedelta(hours=6)
        )
        gm1_3 = Message(
            conversation_id=g1.id,
            sender_id=karan.id,
            content="Next.js 16 build is passing with zero TypeScript errors. Production bundle optimized!",
            message_type="text",
            status="read",
            created_at=now - timedelta(hours=2)
        )
        gm1_4 = Message(
            conversation_id=g1.id,
            sender_id=sid.id,
            content="WebSockets connection manager is handling auto-reconnects and live read receipts.",
            message_type="text",
            status="read",
            created_at=now - timedelta(minutes=5)
        )
        db.add_all([gm1_1, gm1_2, gm1_3, gm1_4])
        db.flush()

        db.add_all([
            MessageReaction(message_id=gm1_2.id, user_id=rohit.id, emoji="👍"),
            MessageReaction(message_id=gm1_3.id, user_id=ananya.id, emoji="🎉"),
            MessageReaction(message_id=gm1_4.id, user_id=karwan.id, emoji="🔥")
        ])

        # 7. Group Chat 2: Frontend & UI Guild 🎨
        g2 = Conversation(
            is_group=True,
            name="Frontend & UI Guild 🎨",
            avatar_url="https://api.dicebear.com/7.x/identicon/svg?seed=FrontendGuild",
            updated_at=now - timedelta(minutes=35)
        )
        db.add(g2)
        db.flush()

        db.add_all([
            ConversationMember(conversation_id=g2.id, user_id=ananya.id, role="admin"),
            ConversationMember(conversation_id=g2.id, user_id=rohit.id, role="member"),
            ConversationMember(conversation_id=g2.id, user_id=priya.id, role="member")
        ])

        gm2_1 = Message(
            conversation_id=g2.id,
            sender_id=ananya.id,
            content="Dark theme design tokens are updated to matching Signal Messenger UI palette.",
            message_type="text",
            status="read",
            created_at=now - timedelta(hours=1)
        )
        gm2_2 = Message(
            conversation_id=g2.id,
            sender_id=priya.id,
            content="Tested responsive layouts across mobile, tablet, and desktop viewports. Looks great!",
            message_type="text",
            status="read",
            created_at=now - timedelta(minutes=35)
        )
        db.add_all([gm2_1, gm2_2])
        db.flush()

        # 8. Group Chat 3: DevOps & Infra 🛠️
        g3 = Conversation(
            is_group=True,
            name="DevOps & Infra 🛠️",
            avatar_url="https://api.dicebear.com/7.x/identicon/svg?seed=DevOpsInfra",
            updated_at=now - timedelta(hours=2)
        )
        db.add(g3)
        db.flush()

        db.add_all([
            ConversationMember(conversation_id=g3.id, user_id=karan.id, role="admin"),
            ConversationMember(conversation_id=g3.id, user_id=rohit.id, role="member"),
            ConversationMember(conversation_id=g3.id, user_id=karwan.id, role="member")
        ])

        gm3_1 = Message(
            conversation_id=g3.id,
            sender_id=karan.id,
            content="Backend Uvicorn server configured on port 8000. Next.js running on port 3000.",
            message_type="text",
            status="read",
            created_at=now - timedelta(hours=2)
        )
        db.add(gm3_1)

        db.commit()
        print("✅ Seeded database successfully with 8 users, 5 conversations, and rich chat history!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding DB: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
