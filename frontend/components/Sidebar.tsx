'use client';

import React, { useState } from 'react';
import { Search, UserPlus, Users, Settings, LogOut, ShieldCheck, MessageSquare, Check, CheckCheck, Sparkles, Filter } from 'lucide-react';
import { User, Conversation } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface SidebarProps {
  currentUser: User;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (convId: string) => void;
  onOpenNewChatModal: () => void;
  onOpenNewGroupModal: () => void;
  onOpenSettingsModal: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentUser,
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenNewChatModal,
  onOpenNewGroupModal,
  onOpenSettingsModal,
  onLogout,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.display_title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === 'unread') return conv.unread_count > 0;
    if (filterTab === 'groups') return conv.is_group;
    return true;
  });

  return (
    <aside className="w-80 md:w-96 flex flex-col h-full bg-[#11131a] border-r border-[#232838] select-none shrink-0">
      {/* Top Header Bar */}
      <div className="p-4 flex items-center justify-between border-b border-[#232838] bg-[#171a23]/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={onOpenSettingsModal}>
            <img
              src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`}
              alt={currentUser.display_name}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#2c6bed]/50 bg-[#090a0f] shadow-md group-hover:border-[#2c6bed] transition"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#11131a] shadow-sm" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 leading-tight">
              {currentUser.display_name}
              <ShieldCheck className="w-3.5 h-3.5 text-[#2c6bed]" />
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">{currentUser.phone_number}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewChatModal}
            title="New Direct Message"
            className="p-2 text-slate-400 hover:text-white hover:bg-[#1e2230] rounded-xl transition duration-150 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNewGroupModal}
            title="New Group Chat"
            className="p-2 text-slate-400 hover:text-white hover:bg-[#1e2230] rounded-xl transition duration-150 active:scale-95"
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettingsModal}
            title="Preferences"
            className="p-2 text-slate-400 hover:text-white hover:bg-[#1e2230] rounded-xl transition duration-150 active:scale-95"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition duration-150 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="p-3 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats or contacts..."
            className="w-full bg-[#171a23] border border-[#232838] focus:border-[#2c6bed] focus:ring-1 focus:ring-[#2c6bed] rounded-xl py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          {(['all', 'unread', 'groups'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition duration-150 ${
                filterTab === tab
                  ? 'bg-gradient-to-r from-[#2c6bed] to-[#1e52c8] text-white shadow-md shadow-[#2c6bed]/20'
                  : 'bg-[#171a23] text-slate-400 hover:bg-[#1e2230] hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#232838]/40 px-2 py-1 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500 text-xs">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#2c6bed]" />
            No active conversations.
            <button
              onClick={onOpenNewChatModal}
              className="mt-3 block mx-auto text-xs font-semibold text-[#2c6bed] hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversationId === conv.id;
            const lastMsg = conv.last_message;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition duration-150 border ${
                  isActive
                    ? 'bg-[#171a23] border-[#2c6bed]/50 shadow-lg shadow-[#2c6bed]/10'
                    : 'bg-transparent border-transparent hover:bg-[#171a23]/60'
                }`}
              >
                {/* Avatar with Group Badge */}
                <div className="relative shrink-0">
                  <img
                    src={conv.display_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.id}`}
                    alt={conv.display_title}
                    className="w-11 h-11 rounded-full object-cover bg-[#090a0f] border border-[#232838]"
                  />
                  {conv.is_group && (
                    <div className="absolute -bottom-1 -right-1 bg-[#2c6bed] text-white rounded-full p-0.5 border-2 border-[#11131a] shadow-sm">
                      <Users className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Conversation Meta Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-slate-100 truncate leading-tight">
                      {conv.display_title}
                    </h3>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1 truncate pr-2">
                      {lastMsg && lastMsg.sender_id === currentUser.id && (
                        <span>
                          {lastMsg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </span>
                      )}
                      <span className="truncate text-[11px] text-slate-300">
                        {lastMsg
                          ? lastMsg.message_type === 'image'
                            ? '📷 Photo'
                            : lastMsg.content
                          : 'No messages yet'}
                      </span>
                    </div>

                    {conv.unread_count > 0 && (
                      <span className="bg-[#2c6bed] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-md shadow-[#2c6bed]/30 animate-pulse-subtle">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
