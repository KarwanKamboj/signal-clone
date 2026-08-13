'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, ShieldCheck, Crown } from 'lucide-react';
import { User, Conversation, Contact } from '@/lib/types';
import { api } from '@/lib/api';

interface GroupInfoModalProps {
  currentUser: User;
  conversation: Conversation;
  onClose: () => void;
  onUpdateConversation: (updatedConv: Conversation) => void;
}

export default function GroupInfoModal({
  currentUser,
  conversation,
  onClose,
  onUpdateConversation,
}: GroupInfoModalProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const currentMember = conversation.members.find((m) => m.user_id === currentUser.id);
  const isAdmin = currentMember?.role === 'admin';

  useEffect(() => {
    async function loadContacts() {
      try {
        const data = await api.getContacts();
        setContacts(data);
      } catch (err) {}
    }
    if (showAddMember) {
      loadContacts();
    }
  }, [showAddMember]);

  const handleAddMember = async (userId: string) => {
    setLoading(true);
    try {
      const updated = await api.addGroupMember(conversation.id, userId);
      onUpdateConversation(updated);
      setShowAddMember(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    setLoading(true);
    try {
      const updated = await api.removeGroupMember(conversation.id, userId);
      onUpdateConversation(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const existingMemberIds = new Set(conversation.members.map((m) => m.user_id));
  const addableContacts = contacts.filter((c) => !existingMemberIds.has(c.contact_user.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-md bg-[#1e1e1e] border border-[#2a2a2e] rounded-2xl p-6 shadow-2xl text-[#ecebed]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2a2a2e]">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2c6bed]" />
            {conversation.is_group ? 'Group Details' : 'Contact Details'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#282828] rounded-xl text-[#9e9ea0]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="flex flex-col items-center my-6 text-center">
          <img
            src={conversation.display_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${conversation.id}`}
            alt={conversation.display_title}
            className="w-20 h-20 rounded-full object-cover bg-[#121212] border-2 border-[#2c6bed] mb-3 shadow-lg"
          />
          <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
            {conversation.display_title}
            <ShieldCheck className="w-4 h-4 text-[#2c6bed]" />
          </h3>
          <p className="text-xs text-[#9e9ea0] font-mono mt-0.5">
            {conversation.is_group
              ? `${conversation.members.length} Members`
              : 'End-to-End Encrypted'}
          </p>
        </div>

        {/* Group Members List */}
        {conversation.is_group && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9e9ea0]">
                Group Members ({conversation.members.length})
              </span>

              {isAdmin && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-xs font-semibold text-[#2c6bed] hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Member
                </button>
              )}
            </div>

            {/* Add Member Dropdown */}
            {showAddMember && (
              <div className="mb-4 p-3 bg-[#121212] border border-[#2a2a2e] rounded-xl">
                <div className="text-xs font-semibold text-white mb-2">Select contact to add:</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {addableContacts.length === 0 ? (
                    <div className="text-xs text-[#6e6e73] py-2">No new contacts available to add</div>
                  ) : (
                    addableContacts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleAddMember(c.contact_user.id)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#282828] cursor-pointer text-xs"
                      >
                        <span className="font-semibold text-white">{c.contact_user.display_name}</span>
                        <span className="text-[#2c6bed] font-semibold">Add</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Members */}
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {conversation.members.map((m) => {
                const memberUser = m.user;
                const isMemberAdmin = m.role === 'admin';

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 bg-[#121212] border border-[#2a2a2e] rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={memberUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`}
                        alt={memberUser?.display_name || 'Member'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1">
                          {memberUser?.display_name || 'Group Member'}
                          {isMemberAdmin && (
                            <span className="bg-[#2c6bed]/20 text-[#2c6bed] text-[10px] px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" /> Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#6e6e73] font-mono">{memberUser?.phone_number}</div>
                      </div>
                    </div>

                    {isAdmin && m.user_id !== currentUser.id && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="p-1.5 hover:bg-red-500/10 text-[#6e6e73] hover:text-red-400 rounded-lg transition"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
