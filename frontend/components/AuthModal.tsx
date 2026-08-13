'use client';

import React, { useState } from 'react';
import { Phone, Lock, User, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { User as UserType } from '@/lib/types';

interface AuthModalProps {
  onSuccess: (user: UserType, token: string) => void;
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+919876543210');
  const [otp, setOtp] = useState('123456');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickLogins = [
    { name: 'Rohit', phone: '+919876543210' },
    { name: 'Karwan', phone: '+919811223344' },
    { name: 'Ananya Sharma', phone: '+919822334455' },
    { name: 'Karan Malhotra', phone: '+919833445566' },
    { name: 'Priya Verma', phone: '+919844556677' },
    { name: 'Siddharth Rao', phone: '+919855667788' },
  ];

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber) return setError('Please enter a phone number');

    setLoading(true);
    setError('');
    try {
      await api.requestOtp(phoneNumber);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp) return setError('Please enter verification code');

    setLoading(true);
    setError('');
    try {
      const res = await api.verifyOtp(phoneNumber, otp, displayName || undefined);
      localStorage.setItem('signal_token', res.access_token);
      localStorage.setItem('signal_user', JSON.stringify(res.user));
      onSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#171a23] border border-[#232838] rounded-3xl p-8 shadow-2xl text-slate-100 animate-pop-in">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#2c6bed] to-[#1d52c7] rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-[#2c6bed]/30">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Signal Web</h1>
          <p className="text-xs text-slate-400 mt-1">End-to-End Encrypted Messaging</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs text-center">
            {error}
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#090a0f] border border-[#232838] focus:border-[#2c6bed] focus:ring-1 focus:ring-[#2c6bed] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#2c6bed] to-[#1d52c7] hover:from-[#255bc9] hover:to-[#1a4ab4] text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#2c6bed]/20 transition disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Continue'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick Profiles Grid */}
            <div className="pt-4 border-t border-[#232838] mt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5">
                <UserCheck className="w-3.5 h-3.5 text-[#2c6bed]" />
                Quick Dev Profiles
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickLogins.map((acc) => (
                  <button
                    key={acc.phone}
                    type="button"
                    onClick={() => {
                      setPhoneNumber(acc.phone);
                      setStep('otp');
                    }}
                    className="text-left p-2.5 bg-[#090a0f] hover:bg-[#1e2230] border border-[#232838] rounded-xl text-xs transition group"
                  >
                    <div className="font-semibold text-white group-hover:text-[#2c6bed] transition truncate">
                      {acc.name}
                    </div>
                    <div className="text-slate-500 text-[10px] truncate font-mono">{acc.phone}</div>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Verification OTP (Test Code: <span className="text-[#2c6bed] font-mono font-bold">123456</span>)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-[#090a0f] border border-[#232838] focus:border-[#2c6bed] focus:ring-1 focus:ring-[#2c6bed] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white tracking-widest font-mono placeholder-slate-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Display Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-[#090a0f] border border-[#232838] focus:border-[#2c6bed] focus:ring-1 focus:ring-[#2c6bed] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="flex-1 bg-[#090a0f] hover:bg-[#1e2230] text-slate-400 font-medium py-2.5 rounded-xl text-xs transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 bg-gradient-to-r from-[#2c6bed] to-[#1d52c7] hover:from-[#255bc9] hover:to-[#1a4ab4] text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg shadow-[#2c6bed]/20 transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
