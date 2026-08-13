import { User, Contact, Conversation, Message, MessageReaction } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function getAuthHeaders(token?: string) {
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('signal_token') : null);
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

export const api = {
  // Auth
  async requestOtp(phoneNumber: string) {
    const res = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async verifyOtp(phoneNumber: string, otp: string, displayName?: string) {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phoneNumber,
        otp,
        display_name: displayName,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Users & Contacts
  async searchUsers(query: string): Promise<User[]> {
    const res = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to search users');
    return res.json();
  },

  async getContacts(): Promise<Contact[]> {
    const res = await fetch(`${API_BASE_URL}/users/contacts`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch contacts');
    return res.json();
  },

  async addContact(contactUserId: string, nickname?: string): Promise<Contact> {
    const res = await fetch(`${API_BASE_URL}/users/contacts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contact_user_id: contactUserId, nickname }),
    });
    if (!res.ok) throw new Error('Failed to add contact');
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE_URL}/conversations`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async createDirectConversation(targetUserId: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE_URL}/conversations/direct`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
    if (!res.ok) throw new Error('Failed to create direct conversation');
    return res.json();
  },

  async createGroupConversation(name: string, memberUserIds: string[], avatarUrl?: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE_URL}/conversations/group`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        member_user_ids: memberUserIds,
        avatar_url: avatarUrl,
      }),
    });
    if (!res.ok) throw new Error('Failed to create group conversation');
    return res.json();
  },

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async sendMessage(
    conversationId: string,
    content: string,
    messageType: string = 'text',
    mediaUrl?: string,
    replyToId?: string
  ): Promise<Message> {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        conversation_id: conversationId,
        content,
        message_type: messageType,
        media_url: mediaUrl,
        reply_to_id: replyToId,
      }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async addReaction(messageId: string, emoji: string): Promise<MessageReaction> {
    const res = await fetch(`${API_BASE_URL}/conversations/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) throw new Error('Failed to add reaction');
    return res.json();
  },

  // Group Admin Controls
  async addGroupMember(conversationId: string, userId: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id: userId, role: 'member' }),
    });
    if (!res.ok) throw new Error('Failed to add group member');
    return res.json();
  },

  async removeGroupMember(conversationId: string, userId: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/members/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove group member');
    return res.json();
  },

  // Media Upload
  async uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('signal_token');
    const res = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  },
};
