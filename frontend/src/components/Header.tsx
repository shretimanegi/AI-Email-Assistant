'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types';
import { Bell, Sun, Moon, RefreshCw, Zap } from 'lucide-react';

interface HeaderProps {
  title: string;
  onSync?: () => void;
  syncing?: boolean;
  user?: User | null;
}

export default function Header({ title, onSync, syncing = false, user: propUser }: HeaderProps) {
  const [internalUser, setInternalUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!propUser) {
      // Get user profile info
      api.getMe().then(setInternalUser).catch(console.error);
    }
  }, [propUser]);

  useEffect(() => {
    // Initial check for dark class on html element
    const isDark = document.documentElement.classList.contains('dark-theme');
    setDarkMode(isDark);
  }, []);

  const user = propUser || internalUser;

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  };

  return (
    <header className="h-16 w-full flex items-center justify-between px-8 border-b border-white/20 bg-white/40 dark:bg-black/30 backdrop-blur-md sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          {title}
          {syncing && (
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500 animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Syncing Gmail...
            </span>
          )}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Sync trigger */}
        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Sync with Gmail"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-200 hover:scale-105"
          title="Toggle Dark Mode"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {/* Core Productivity Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D8F3DC]/40 text-[#40916c] dark:bg-[#D8F3DC]/10 dark:text-[#52b788] text-xs font-semibold border border-[#D8F3DC]/60">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>98% Productive</span>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700" />

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.full_name || 'Demo User'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
            {/* User Avatar */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'}
              alt="Avatar"
              className="w-9 h-9 rounded-xl border border-white bg-[#BDE0FE]/30 shadow-inner"
            />
          </div>
        )}
      </div>
    </header>
  );
}
