'use client';

import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Moon, Sun, Lock, Shield, Bell, User as UserIcon, Check } from 'lucide-react';
import { User } from '@/lib/types';
import { api } from '@/lib/api';

interface SettingsModalProps {
  currentUser: User;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

export default function SettingsModal({
  currentUser,
  isDarkMode,
  onToggleDarkMode,
  onClose,
  onUpdateUser,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'privacy' | 'notifications'>('appearance');
  const [displayName, setDisplayName] = useState(currentUser.display_name);
  const [about, setAbout] = useState(currentUser.about || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await api.updateProfile({ display_name: displayName, about });
      onUpdateUser(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg bg-[#1e1e1e] border border-[#2a2a2e] rounded-2xl shadow-2xl text-[#ecebed] flex flex-col h-[520px]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2e]">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#2c6bed]" />
            Signal Preferences
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#282828] rounded-xl text-[#9e9ea0]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Navigation Bar */}
          <div className="w-40 border-r border-[#2a2a2e] p-3 space-y-1 bg-[#1a1a1c]">
            {[
              { id: 'appearance', label: 'Appearance', icon: Moon },
              { id: 'privacy', label: 'Privacy', icon: Lock },
              { id: 'account', label: 'Account', icon: UserIcon },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#2c6bed] text-white shadow-md'
                      : 'text-[#9e9ea0] hover:bg-[#282828] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Pane */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Theme</h3>
                  <p className="text-xs text-[#9e9ea0] mb-4">Choose how Signal looks on your display.</p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={onToggleDarkMode}
                      className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition ${
                        isDarkMode ? 'border-[#2c6bed] bg-[#2c6bed]/10' : 'border-[#2a2a2e] bg-[#121212]'
                      }`}
                    >
                      <Moon className="w-6 h-6 text-[#2c6bed]" />
                      <span className="text-xs font-semibold">Dark Mode</span>
                    </button>

                    <button
                      onClick={onToggleDarkMode}
                      className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition ${
                        !isDarkMode ? 'border-[#2c6bed] bg-[#2c6bed]/10' : 'border-[#2a2a2e] bg-[#121212]'
                      }`}
                    >
                      <Sun className="w-6 h-6 text-amber-400" />
                      <span className="text-xs font-semibold">Light Mode</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">End-to-End Encryption</h3>
                  <p className="text-xs text-[#9e9ea0] mb-3">
                    All 1-on-1 and group messages on Signal are protected with simulated end-to-end cryptographic protocols.
                  </p>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
                    <Shield className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-400">Safety Number Active</div>
                      <div className="text-[11px] text-[#9e9ea0] font-mono">Verified Session Key: 98F2-A004-9C11</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2a2a2e]">
                  <h3 className="text-sm font-semibold text-white mb-1">Disappearing Messages</h3>
                  <p className="text-xs text-[#9e9ea0]">Default timer for new messages across all chats: <span className="text-[#2c6bed] font-bold">Off</span></p>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9e9ea0] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2a2a2e] focus:border-[#2c6bed] rounded-xl py-2 px-3 text-xs text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9e9ea0] mb-1">
                    About / Bio
                  </label>
                  <input
                    type="text"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2a2a2e] focus:border-[#2c6bed] rounded-xl py-2 px-3 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9e9ea0] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={currentUser.phone_number}
                    disabled
                    className="w-full bg-[#121212]/50 border border-[#2a2a2e] rounded-xl py-2 px-3 text-xs text-[#6e6e73] font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#2c6bed] hover:bg-[#255bc9] text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg transition"
                >
                  {savedSuccess ? <Check className="w-4 h-4 text-white" /> : saving ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#121212] rounded-xl">
                  <div>
                    <div className="text-xs font-semibold text-white">Message Sound</div>
                    <div className="text-[10px] text-[#6e6e73]">Play sound for incoming messages</div>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[#2c6bed] w-4 h-4" />
                </div>

                <div className="flex items-center justify-between p-3 bg-[#121212] rounded-xl">
                  <div>
                    <div className="text-xs font-semibold text-white">Unread Count Badge</div>
                    <div className="text-[10px] text-[#6e6e73]">Show unread message badge</div>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[#2c6bed] w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
