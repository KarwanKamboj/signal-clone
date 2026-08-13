'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, MessageSquare, Check } from 'lucide-react';
import { User, Contact } from '@/lib/types';
import { api } from '@/lib/api';

interface NewChatModalProps {
  currentUser: User;
  onClose: () => void;
  onSelectConversation: (convId: string) => void;
}

export default function NewChatModal({ currentUser, onClose, onSelectConversation }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadContacts() {
      try {
        const data = await api.getContacts();
        setContacts(data);
      } catch (err) {
        console.error('Failed to load contacts');
      }
    }
    loadContacts();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const results = await api.searchUsers(query.trim());
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const startChatWithUser = async (targetUserId: string) => {
    try {
      // Also add as contact
      try {
        await api.addContact(targetUserId);
      } catch (e) {}

      const conv = await api.createDirectConversation(targetUserId);
      onSelectConversation(conv.id);
      onClose();
    } catch (err) {
      alert('Failed to start conversation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1e1e1e] border border-[#2a2a2e] rounded-2xl p-6 shadow-2xl text-[#ecebed]">
        <div className="flex items-center justify-between pb-4 border-b border-[#2a2a2e]">
          <div className="flex items-center gap-2 font-bold text-lg">
            <UserPlus className="w-5 h-5 text-[#2c6bed]" />
            New Direct Message
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#282828] rounded-xl text-[#9e9ea0]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#6e6e73]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by phone number, username or name..."
              className="w-full bg-[#121212] border border-[#2a2a2e] focus:border-[#2c6bed] rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-[#6e6e73] outline-none transition"
              autoFocus
            />
          </div>
        </div>

        {/* Results / Contact List */}
        <div className="mt-4 max-h-64 overflow-y-auto space-y-1 pr-1">
          {searchQuery.trim() ? (
            loading ? (
              <div className="text-xs text-[#6e6e73] text-center py-4">Searching Signal directory...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-xs text-[#6e6e73] text-center py-4">No users found matching query</div>
            ) : (
              searchResults.map((u) => (
                <div
                  key={u.id}
                  onClick={() => startChatWithUser(u.id)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#282828] cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                      alt={u.display_name}
                      className="w-9 h-9 rounded-full object-cover bg-[#121212]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">{u.display_name}</div>
                      <div className="text-[10px] text-[#6e6e73] font-mono">{u.phone_number}</div>
                    </div>
                  </div>
                  <MessageSquare className="w-4 h-4 text-[#2c6bed]" />
                </div>
              ))
            )
          ) : (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9e9ea0] mb-2 px-1">
                Your Contacts
              </div>
              {contacts.length === 0 ? (
                <div className="text-xs text-[#6e6e73] text-center py-4">No contacts added yet</div>
              ) : (
                contacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => startChatWithUser(c.contact_user.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#282828] cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={c.contact_user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.contact_user.id}`}
                        alt={c.contact_user.display_name}
                        className="w-9 h-9 rounded-full object-cover bg-[#121212]"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {c.nickname || c.contact_user.display_name}
                        </div>
                        <div className="text-[10px] text-[#6e6e73] font-mono">{c.contact_user.phone_number}</div>
                      </div>
                    </div>
                    <MessageSquare className="w-4 h-4 text-[#2c6bed]" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
