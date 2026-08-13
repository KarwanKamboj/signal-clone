'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Search, Check, Plus } from 'lucide-react';
import { User, Contact } from '@/lib/types';
import { api } from '@/lib/api';

interface CreateGroupModalProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: (newConvId: string) => void;
}

export default function CreateGroupModal({ currentUser, onClose, onSuccess }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return setError('Please enter a group name');
    if (selectedUserIds.length === 0) return setError('Please select at least 1 member');

    setLoading(true);
    setError('');
    try {
      const newGroup = await api.createGroupConversation(groupName.trim(), selectedUserIds);
      onSuccess(newGroup.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.contact_user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_user.phone_number.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#1e1e1e] border border-[#2a2a2e] rounded-2xl p-6 shadow-2xl text-[#ecebed]">
        <div className="flex items-center justify-between pb-4 border-b border-[#2a2a2e]">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Users className="w-5 h-5 text-[#2c6bed]" />
            New Group Chat
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#282828] rounded-xl text-[#9e9ea0]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9e9ea0] mb-1.5">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Scaler Engineering Team"
              className="w-full bg-[#121212] border border-[#2a2a2e] focus:border-[#2c6bed] rounded-xl py-2.5 px-4 text-sm text-white placeholder-[#6e6e73] outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9e9ea0] mb-1.5">
              Add Members ({selectedUserIds.length} selected)
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#6e6e73]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full bg-[#121212] border border-[#2a2a2e] focus:border-[#2c6bed] rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-[#6e6e73] outline-none transition"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredContacts.length === 0 ? (
                <div className="text-xs text-[#6e6e73] text-center py-4">No contacts found</div>
              ) : (
                filteredContacts.map((c) => {
                  const isSelected = selectedUserIds.includes(c.contact_user.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleUserSelection(c.contact_user.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                        isSelected ? 'bg-[#2c6bed]/20 border border-[#2c6bed]/40' : 'hover:bg-[#282828]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={c.contact_user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.contact_user.id}`}
                          alt={c.contact_user.display_name}
                          className="w-8 h-8 rounded-full object-cover bg-[#121212]"
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {c.nickname || c.contact_user.display_name}
                          </div>
                          <div className="text-[10px] text-[#6e6e73] font-mono">{c.contact_user.phone_number}</div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isSelected ? 'bg-[#2c6bed] border-[#2c6bed]' : 'border-[#6e6e73]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#121212] hover:bg-[#282828] text-[#9e9ea0] font-medium py-2.5 rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#2c6bed] hover:bg-[#255bc9] text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
