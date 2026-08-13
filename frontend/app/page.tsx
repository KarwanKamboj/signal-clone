'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatPane from '@/components/ChatPane';
import AuthModal from '@/components/AuthModal';
import NewChatModal from '@/components/NewChatModal';
import CreateGroupModal from '@/components/CreateGroupModal';
import GroupInfoModal from '@/components/GroupInfoModal';
import SettingsModal from '@/components/SettingsModal';
import PlaceholderModal from '@/components/PlaceholderModal';

import { User, Conversation, Message, WSEvent } from '@/lib/types';
import { api } from '@/lib/api';
import { useSignalWebSocket } from '@/lib/websocket';
import { ShieldCheck, MessageSquare } from 'lucide-react';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [convId: string]: string[] }>({});
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Modals state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [placeholderType, setPlaceholderType] = useState<'voice' | 'video' | 'linked_devices' | 'stories' | null>(null);

  // Load saved auth state on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('signal_token');
    const savedUser = localStorage.getItem('signal_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('signal_user');
      }
    }
  }, []);

  // Fetch active conversations list
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeConversationId) {
        setActiveConversationId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [token, activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async () => {
    if (!activeConversationId || !token) return;
    try {
      const msgs = await api.getMessages(activeConversationId);
      setMessages(msgs);

      // Send read receipt trigger
      sendReadReceipt(activeConversationId);
      
      // Update unread count locally
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversationId ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [activeConversationId, token]);

  // Real-time WebSocket Event Handler
  const handleWSEvent = useCallback(
    (event: WSEvent) => {
      console.log('WS Event Received:', event.type, event.data);

      if (event.type === 'new_message') {
        const newMsg: Message = event.data;

        // If message is for currently open conversation
        if (newMsg.conversation_id === activeConversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }

        // Update conversation list last message and unread count
        setConversations((prev) => {
          return prev.map((c) => {
            if (c.id === newMsg.conversation_id) {
              const isCurrent = c.id === activeConversationId;
              return {
                ...c,
                last_message: newMsg,
                updated_at: newMsg.created_at,
                unread_count: isCurrent ? 0 : c.unread_count + 1,
              };
            }
            return c;
          });
        });
      } else if (event.type === 'typing') {
        const { conversation_id, display_name, is_typing } = event.data;
        setTypingUsers((prev) => {
          const currentList = prev[conversation_id] || [];
          if (is_typing) {
            if (!currentList.includes(display_name)) {
              return { ...prev, [conversation_id]: [...currentList, display_name] };
            }
          } else {
            return {
              ...prev,
              [conversation_id]: currentList.filter((name) => name !== display_name),
            };
          }
          return prev;
        });
      } else if (event.type === 'reaction') {
        const { message_id, emoji, user } = event.data;
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === message_id) {
              const filtered = m.reactions ? m.reactions.filter((r) => r.user_id !== user.id) : [];
              return {
                ...m,
                reactions: [
                  ...filtered,
                  {
                    id: Math.random().toString(),
                    message_id,
                    user_id: user.id,
                    emoji,
                    created_at: new Date().toISOString(),
                    user,
                  },
                ],
              };
            }
            return m;
          })
        );
      } else if (event.type === 'read_receipt') {
        const { conversation_id } = event.data;
        if (conversation_id === activeConversationId) {
          setMessages((prev) => prev.map((m) => ({ ...m, status: 'read' })));
        }
      }
    },
    [activeConversationId]
  );

  const { sendTyping, sendReadReceipt } = useSignalWebSocket(token, handleWSEvent);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleAuthSuccess = (user: User, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('signal_token');
    localStorage.removeItem('signal_user');
    setToken(null);
    setCurrentUser(null);
    setConversations([]);
    setActiveConversationId(null);
  };

  const handleSendMessage = async (
    content: string,
    messageType: string = 'text',
    mediaUrl?: string,
    replyToId?: string
  ) => {
    if (!activeConversationId) return;
    try {
      const sentMsg = await api.sendMessage(
        activeConversationId,
        content,
        messageType,
        mediaUrl,
        replyToId
      );

      // Append locally
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });

      // Update sidebar list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId ? { ...c, last_message: sentMsg, updated_at: sentMsg.created_at } : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await api.addReaction(messageId, emoji);
    } catch (err) {
      console.error('Failed to add reaction:', err);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Render Auth screen if not authenticated
  if (!token || !currentUser) {
    return <AuthModal onSuccess={handleAuthSuccess} />;
  }

  return (
    <main className={`flex h-screen w-screen overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* Sidebar Panel */}
      <Sidebar
        currentUser={currentUser}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onOpenNewChatModal={() => setShowNewChatModal(true)}
        onOpenNewGroupModal={() => setShowCreateGroupModal(true)}
        onOpenSettingsModal={() => setShowSettingsModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Chat Pane Panel */}
      {activeConversation ? (
        <ChatPane
          currentUser={currentUser}
          conversation={activeConversation}
          messages={messages}
          typingUsers={typingUsers}
          onSendMessage={handleSendMessage}
          onTyping={(isTyping) => sendTyping(activeConversation.id, isTyping)}
          onOpenGroupInfo={() => setShowGroupInfoModal(true)}
          onOpenCallPlaceholder={(type) => setPlaceholderType(type)}
          onAddReaction={handleAddReaction}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#121212] text-center p-8 select-none">
          <div className="w-20 h-20 bg-[#2c6bed]/15 border border-[#2c6bed]/30 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
            <ShieldCheck className="w-12 h-12 text-[#2c6bed]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Signal for Web</h2>
          <p className="text-sm text-[#9e9ea0] max-w-sm leading-relaxed mb-6">
            Select a conversation from the sidebar or start a new chat to begin sending end-to-end encrypted messages.
          </p>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="px-6 py-3 bg-[#2c6bed] hover:bg-[#255bc9] text-white font-medium text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            New Direct Message
          </button>
        </div>
      )}

      {/* Modals */}
      {showNewChatModal && (
        <NewChatModal
          currentUser={currentUser}
          onClose={() => setShowNewChatModal(false)}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            loadConversations();
          }}
        />
      )}

      {showCreateGroupModal && (
        <CreateGroupModal
          currentUser={currentUser}
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={(id) => {
            setActiveConversationId(id);
            loadConversations();
            setShowCreateGroupModal(false);
          }}
        />
      )}

      {showGroupInfoModal && activeConversation && (
        <GroupInfoModal
          currentUser={currentUser}
          conversation={activeConversation}
          onClose={() => setShowGroupInfoModal(false)}
          onUpdateConversation={(updated) => {
            setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          }}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          currentUser={currentUser}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onClose={() => setShowSettingsModal(false)}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('signal_user', JSON.stringify(updated));
          }}
        />
      )}

      {placeholderType && (
        <PlaceholderModal
          type={placeholderType}
          onClose={() => setPlaceholderType(null)}
        />
      )}
    </main>
  );
}
