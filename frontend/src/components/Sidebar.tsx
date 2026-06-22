'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Mail, Calendar, CheckSquare, BarChart2, Settings, LogOut, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Inbox', href: '/dashboard', icon: Mail },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('gmail_synced_this_session');
    router.push('/');
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col justify-between p-6 border-r border-white/20 bg-white/40 dark:bg-black/30 backdrop-blur-md z-30">
      <div className="flex flex-col gap-8">
        {/* Logo Banner */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#CDB4DB] via-[#FFC8DD] to-[#BDE0FE] flex items-center justify-center shadow-md shadow-[#CDB4DB]/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#2D3748] dark:text-white">MailMind AI</h1>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Email Copilot</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href} className="relative group">
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-[#2D3748] dark:text-white font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {/* Active background transition */}
                  {isActive && (
                    <motion.div
                      layoutId="active-menu"
                      className="absolute inset-0 bg-gradient-to-r from-white/70 to-white/30 dark:from-white/10 dark:to-white/5 border-l-4 border-[#CDB4DB] rounded-xl shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? 'text-[#CDB4DB]' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
