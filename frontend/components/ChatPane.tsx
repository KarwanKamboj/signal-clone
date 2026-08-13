'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Video,
  Info,
  Paperclip,
  Smile,
  Send,
  Lock,
  Check,
  CheckCheck,
  X,
  CornerDownRight,
  ShieldCheck,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { User, Conversation, Message } from '@/lib/types';
import { api } from '@/lib/api';
import { format } from 'date-fns';

interface ChatPaneProps {
  currentUser: User;
  conversation: Conversation;
  messages: Message[];
  typingUsers: { [convId: string]: string[] };
  onSendMessage: (content: string, type?: string, mediaUrl?: string, replyToId?: string) => void;
  onTyping: (isTyping: boolean) => void;
  onOpenGroupInfo: () => void;
  onOpenCallPlaceholder: (type: 'voice' | 'video') => void;
  onAddReaction: (messageId: string, emoji: string) => void;
}

export default function ChatPane({
  currentUser,
  conversation,
  messages,
  typingUsers,
  onSendMessage,
  onTyping,
  onOpenGroupInfo,
  onOpenCallPlaceholder,
  onAddReaction,
}: ChatPaneProps) {
  const [inputText, setInputText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typingList = typingUsers[conversation.id] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingList]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !replyToMessage) return;

    onSendMessage(inputText.trim(), 'text', undefined, replyToMessage?.id);
    setInputText('');
    setReplyToMessage(null);
    onTyping(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadRes = await api.uploadMedia(file);
      const isImage = file.type.startsWith('image/');
      onSendMessage(
        file.name,
        isImage ? 'image' : 'file',
        uploadRes.media_url,
        replyToMessage?.id
      );
    } catch (err) {
      alert('Failed to upload file attachment');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const quickEmojis = ['👍', '❤️', '🔥', '😂', '😮', '🎉'];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] select-text overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#232838] bg-[#11131a]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={onOpenGroupInfo}>
          <img
            src={conversation.display_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${conversation.id}`}
            alt={conversation.display_title}
            className="w-10 h-10 rounded-full object-cover bg-[#090a0f] border border-[#232838]"
          />
          <div>
            <h2 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 leading-tight">
              {conversation.display_title}
              <ShieldCheck className="w-3.5 h-3.5 text-[#2c6bed]" />
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              {conversation.is_group
                ? `${conversation.members.length} Members`
                : 'End-to-End Encrypted Session'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCallPlaceholder('voice')}
            title="Audio Call"
            className="p-2.5 text-slate-400 hover:text-white hover:bg-[#1e2230] rounded-xl transition duration-150 active:scale-95"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenCallPlaceholder('video')}
            title="Video Call"
            className="p-2.5 text-slate-400 hover:text-white hover:bg-[#1e2230] rounded-xl transition duration-150 active:scale-95"
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenGroupInfo}
            title="Conversation Info"
            className="p-2.5 text-slate-400 hover:text-white hover:bg-[#1e2230] rounded-xl transition duration-150 active:scale-95"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Thread */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser.id;
          const isSystem = msg.message_type === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <div className="px-4 py-1.5 bg-[#171a23] border border-[#232838] rounded-full text-xs text-slate-400 flex items-center gap-2 shadow-sm">
                  <Lock className="w-3 h-3 text-[#2c6bed]" />
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`group relative flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-pop-in`}
            >
              {/* Sender Name in Group Chats */}
              {conversation.is_group && !isMe && msg.sender && (
                <span className="text-[11px] font-bold text-[#2c6bed] mb-1 ml-1">
                  {msg.sender.display_name}
                </span>
              )}

              {/* Chat Bubble Container */}
              <div
                className={`relative max-w-[80%] md:max-w-[65%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed transition ${
                  isMe
                    ? 'bg-gradient-to-r from-[#2c6bed] to-[#1d52c7] text-white bubble-shadow-outgoing rounded-tr-xs'
                    : 'bg-[#1b1e2a] text-slate-100 border border-[#232838] bubble-shadow-incoming rounded-tl-xs'
                }`}
              >
                {/* Quoted Message Preview */}
                {msg.reply_to && (
                  <div
                    className={`mb-2 p-2 rounded-lg text-[11px] border-l-2 ${
                      isMe
                        ? 'bg-black/20 border-white/40 text-white/90'
                        : 'bg-[#090a0f]/50 border-[#2c6bed] text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-[10px] opacity-80">
                      {msg.reply_to.sender?.display_name || 'Message'}
                    </div>
                    <div className="truncate">{msg.reply_to.content}</div>
                  </div>
                )}

                {/* Media Image Attachment */}
                {msg.message_type === 'image' && msg.media_url && (
                  <div className="mb-2 overflow-hidden rounded-xl border border-black/10 shadow-md">
                    <img
                      src={`http://localhost:8000${msg.media_url}`}
                      alt="Attachment"
                      className="max-h-60 rounded-xl object-cover"
                    />
                  </div>
                )}

                {/* Message Body */}
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                {/* Footer Timestamp & Receipts */}
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-mono ${
                    isMe ? 'text-white/80' : 'text-slate-400'
                  }`}
                >
                  <span>{format(new Date(msg.created_at), 'p')}</span>

                  {isMe && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </div>

                {/* Emoji Reactions Bar */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {msg.reactions.map((r) => (
                      <span
                        key={r.id}
                        className="bg-[#090a0f]/60 border border-[#232838] px-1.5 py-0.5 rounded-full text-xs"
                      >
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Action Popover */}
                <div
                  className={`absolute top-0 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center gap-1 bg-[#171a23] border border-[#232838] p-1 rounded-xl shadow-xl ${
                    isMe ? '-left-20' : '-right-20'
                  }`}
                >
                  <button
                    onClick={() => setReplyToMessage(msg)}
                    className="p-1 hover:bg-[#1e2230] text-slate-400 hover:text-white rounded-lg transition"
                    title="Reply"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                    className="p-1 hover:bg-[#1e2230] text-slate-400 hover:text-white rounded-lg transition"
                    title="React"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Emoji Picker Popover */}
                {showEmojiPicker === msg.id && (
                  <div className="absolute z-20 bottom-full mb-2 left-0 bg-[#171a23] border border-[#232838] p-2 rounded-2xl shadow-2xl flex items-center gap-1.5 animate-pop-in">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onAddReaction(msg.id, emoji);
                          setShowEmojiPicker(null);
                        }}
                        className="hover:scale-125 transition text-base p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Real-time Typing Banner */}
        {typingList.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic ml-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-[#2c6bed] rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-[#2c6bed] rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-[#2c6bed] rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            {typingList.join(', ')} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quoted Message Preview Bar */}
      {replyToMessage && (
        <div className="px-6 py-2 bg-[#11131a] border-t border-[#232838] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <CornerDownRight className="w-4 h-4 text-[#2c6bed]" />
            <div>
              <span className="font-bold text-slate-200">
                Replying to {replyToMessage.sender?.display_name || 'User'}
              </span>
              <div className="truncate text-[11px] text-slate-500">{replyToMessage.content}</div>
            </div>
          </div>

          <button
            onClick={() => setReplyToMessage(null)}
            className="p-1 hover:bg-[#1e2230] rounded-full text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Input Section */}
      <form onSubmit={handleSend} className="p-4 border-t border-[#232838] bg-[#11131a]/80 shrink-0">
        <div className="flex items-center gap-2 bg-[#171a23] border border-[#232838] focus-within:border-[#2c6bed] focus-within:ring-1 focus-within:ring-[#2c6bed] rounded-2xl p-2 transition">
          {/* File Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#1e2230] rounded-xl transition disabled:opacity-50"
            title="Attach file or photo"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Textarea Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              onTyping(e.target.value.length > 0);
            }}
            placeholder="Signal message..."
            className="flex-1 bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 outline-none px-2"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && !replyToMessage}
            className="p-2.5 bg-gradient-to-r from-[#2c6bed] to-[#1d52c7] hover:from-[#255bc9] hover:to-[#1a4ab4] text-white rounded-xl shadow-md transition duration-150 active:scale-95 disabled:opacity-40 disabled:hover:from-[#2c6bed]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
