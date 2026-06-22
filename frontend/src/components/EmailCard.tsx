'use client';

import React from 'react';
import { Email } from '../types';
import { Sparkles, Calendar, Receipt, ShieldAlert, Award, Inbox } from 'lucide-react';

interface EmailCardProps {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
}

export default function EmailCard({ email, isSelected, onClick }: EmailCardProps) {
  const senderName = email.sender.split('<')[0].trim() || email.sender;
  
  // Format Date
  const dateFormatted = new Date(email.received_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Category Badge Colors & Icon
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Important':
        return { bg: 'bg-[#CDB4DB]/20 text-[#7d5c9c] dark:bg-[#CDB4DB]/10 dark:text-[#CDB4DB]', icon: Award };
      case 'Meeting Requests':
        return { bg: 'bg-[#BDE0FE]/30 text-[#4c84b5] dark:bg-[#BDE0FE]/10 dark:text-[#BDE0FE]', icon: Calendar };
      case 'Finance':
        return { bg: 'bg-[#D8F3DC] text-[#2d6a4f] dark:bg-[#D8F3DC]/10 dark:text-[#86C495]', icon: Receipt };
      case 'Promotions':
        return { bg: 'bg-[#FFC8DD]/30 text-[#bf6083] dark:bg-[#FFC8DD]/10 dark:text-[#FFC8DD]', icon: Sparkles };
      case 'Spam':
        return { bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400', icon: ShieldAlert };
      default:
        return { bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400', icon: Inbox };
    }
  };

  const catStyle = getCategoryStyles(email.category);
  const CatIcon = catStyle.icon;

  // Priority color
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'border-rose-300 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40';
      case 'Medium':
        return 'border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-500 dark:bg-slate-800/20 dark:text-slate-400 dark:border-slate-800/40';
    }
  };

  // Sentiment color dot
  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'Positive') return 'bg-emerald-400';
    if (sentiment === 'Negative') return 'bg-rose-400';
    return 'bg-amber-400';
  };

  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 mb-3 cursor-pointer border transition-all duration-300 relative group overflow-hidden ${
        isSelected
          ? 'ring-2 ring-[#CDB4DB] border-[#CDB4DB]/40 bg-white/90 dark:bg-slate-800/60 shadow-md scale-[1.01]'
          : 'hover:bg-white/80 dark:hover:bg-slate-900/20 border-white/20 dark:border-slate-800/20 hover:scale-[1.005]'
      }`}
    >
      {/* Sentiment dot indicator */}
      <span
        className={`absolute top-0 left-0 w-1.5 h-full ${getSentimentColor(email.sentiment)}`}
        title={`Sentiment: ${email.sentiment}`}
      />

      <div className="flex flex-col gap-3 pl-2">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 ${catStyle.bg}`}>
              <CatIcon className="w-3.5 h-3.5" />
              {email.category}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 border rounded-md font-medium ${getPriorityStyles(email.priority)}`}>
              {email.priority}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">{dateFormatted}</span>
        </div>

        {/* Sender and status */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white flex items-center gap-2">
            {senderName}
            {!email.is_read && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#CDB4DB] animate-pulse" />
            )}
          </h4>
          <h5 className={`text-xs font-semibold mt-1 truncate ${email.is_read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-800 dark:text-slate-100 font-bold'}`}>
            {email.subject}
          </h5>
        </div>

        {/* Snippet text */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {email.body_text || 'No preview available'}
        </p>
      </div>
    </div>
  );
}
