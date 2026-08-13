'use client';

import React from 'react';
import { X, Phone, Video, Laptop, Sparkles, ShieldCheck } from 'lucide-react';

interface PlaceholderModalProps {
  type: 'voice' | 'video' | 'linked_devices' | 'stories';
  onClose: () => void;
}

export default function PlaceholderModal({ type, onClose }: PlaceholderModalProps) {
  const getDetails = () => {
    switch (type) {
      case 'voice':
        return {
          title: 'Signal Encrypted Voice Call',
          icon: Phone,
          description: 'High-definition end-to-end encrypted audio calling is simulated in this build.',
        };
      case 'video':
        return {
          title: 'Signal HD Video Call',
          icon: Video,
          description: 'Low-latency peer-to-peer WebRTC video calling preview.',
        };
      case 'linked_devices':
        return {
          title: 'Linked Desktop & iPad Devices',
          icon: Laptop,
          description: 'Sync conversations across Signal Desktop and iPad clients seamlessly.',
        };
      case 'stories':
        return {
          title: 'Signal Encrypted Stories',
          icon: Sparkles,
          description: 'Share text, photos, and video updates that expire after 24 hours.',
        };
    }
  };

  const details = getDetails();
  const Icon = details.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-sm bg-[#1e1e1e] border border-[#2a2a2e] rounded-2xl p-6 shadow-2xl text-[#ecebed] text-center">
        <div className="w-14 h-14 bg-[#2c6bed]/20 border border-[#2c6bed]/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-[#2c6bed]" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{details.title}</h3>
        <p className="text-xs text-[#9e9ea0] leading-relaxed mb-6">{details.description}</p>

        <div className="p-3 bg-[#121212] border border-[#2a2a2e] rounded-xl text-xs text-[#2c6bed] font-mono flex items-center justify-center gap-1.5 mb-6">
          <ShieldCheck className="w-4 h-4" />
          Placeholder Section — Coming Soon
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#2c6bed] hover:bg-[#255bc9] text-white font-medium py-2.5 rounded-xl text-xs shadow-lg transition"
        >
          Got It
        </button>
      </div>
    </div>
  );
}
