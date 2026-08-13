export interface User {
  id: string;
  phone_number: string;
  username?: string;
  display_name: string;
  avatar_url?: string;
  about?: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_user: User;
  nickname?: string;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id?: string;
  sender?: User;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  media_url?: string;
  file_name?: string;
  reply_to_id?: string;
  reply_to?: Message;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  is_disappearing: boolean;
  expires_in_seconds?: number;
  created_at: string;
  reactions: MessageReaction[];
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user: User;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  members: ConversationMember[];
  last_message?: Message;
  unread_count: number;
  display_title: string;
  display_avatar?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface WSEvent {
  type: string;
  data: any;
}
