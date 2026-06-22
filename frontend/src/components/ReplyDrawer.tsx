'use client';

import React, { useState, useEffect } from 'react';
import { Email, EmailActions } from '../types';
import { api } from '../lib/api';
import { Send, Sparkles, Check, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReplyDrawerProps {
  email: Email;
  actions: EmailActions;
  onReplied?: () => void;
}

type ToneType = 'professional' | 'casual' | 'short' | 'detailed';

export default function ReplyDrawer({ email, actions, onReplied }: ReplyDrawerProps) {
  const [activeTone, setActiveTone] = useState<ToneType>('detailed');
  const [draftText, setDraftText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load the draft when the selected tone or actions change
  useEffect(() => {
    if (actions?.replies) {
      setDraftText(actions.replies[activeTone] || '');
    }
  }, [activeTone, actions]);

  const handleSend = async () => {
    if (!draftText.trim()) return;
    setIsSending(true);
    try {
      const success = await api.sendReply(email.id, draftText);
      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          if (onReplied) onReplied();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const tones: Array<{ id: ToneType; label: string; color: string }> = [
    { id: 'professional', label: 'Professional', color: 'border-[#CDB4DB] hover:bg-[#CDB4DB]/10' },
    { id: 'casual', label: 'Casual', color: 'border-[#FFC8DD] hover:bg-[#FFC8DD]/10' },
    { id: 'short', label: 'Short', color: 'border-[#BDE0FE] hover:bg-[#BDE0FE]/10' },
    { id: 'detailed', label: 'Detailed', color: 'border-[#D8F3DC] hover:bg-[#D8F3DC]/10' }
  ];

  return (
    <div className="glass-card p-6 border-white/20 bg-white/50 dark:bg-slate-900/15">
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/40 pb-3">
          <Sparkles className="w-5 h-5 text-[#FFC8DD]" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Smart Reply Copilot</h3>
        </div>

        {/* Tone Selection Tabs */}
        <div className="grid grid-cols-4 gap-1.5">
          {tones.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTone(t.id)}
              className={`py-2 px-0.5 text-center text-[10px] font-bold tracking-tight border rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${t.color} ${
                activeTone === t.id
                  ? 'bg-black text-white border-transparent shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-slate-900/25'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="relative">
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={17}
            className="w-full text-xs p-4 rounded-2xl bg-white/60 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/45 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#CDB4DB] font-medium leading-relaxed resize-none"
            placeholder="Composing reply draft..."
          />
          <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100/60 text-slate-400">
            <Edit2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end relative">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-[#D8F3DC] text-[#2d6a4f] px-5 py-2.5 rounded-xl text-xs font-bold border border-[#D8F3DC]/40 shadow-sm"
              >
                <Check className="w-4 h-4" />
                Reply Sent!
              </motion.div>
            ) : (
              <button
                onClick={handleSend}
                disabled={isSending || !draftText.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-[#CDB4DB] to-[#BDE0FE] text-slate-800 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-[#CDB4DB]/20 hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <div className="spinner w-3.5 h-3.5" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-slate-700" />
                    Send Reply
                  </>
                )}
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
