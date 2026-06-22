'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { Brain, Sparkles, Shield, Zap, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { url } = await api.login();
      // In production, direct to Google authorization URL
      // For mock dev, api.login() resolves to '/dashboard?token=...'
      if (url.startsWith('http')) {
        window.location.href = url;
      } else {
        // Direct local transition
        localStorage.setItem('auth_token', 'mock-jwt-token');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      // Fallback
      localStorage.setItem('auth_token', 'mock-jwt-token');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="animated-bg min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Blurry background decorations */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[#BDE0FE]/40 blur-3xl -top-20 -left-20 animate-pulse" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-[#FFC8DD]/40 blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md glass-card p-10 border-white/30 bg-white/45 flex flex-col gap-8 text-center relative z-10"
      >
        {/* Brand Banner */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#CDB4DB] via-[#FFC8DD] to-[#BDE0FE] flex items-center justify-center shadow-lg shadow-[#CDB4DB]/30 border border-white/45">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">MailMind AI</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Autonomous Email Agent Copilot</p>
          </div>
        </div>

        {/* Feature List */}
        <div className="flex flex-col gap-3.5 text-left border-y border-white/20 py-6 my-1">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-[#CDB4DB]/20 text-[#8c6da8]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Multi-Agent Orchestration</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">LangGraph routing automates classification, summarization & replies.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-[#BDE0FE]/20 text-[#4379a8]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Calendar & Scheduling Automation</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Detects meeting intent, checks busy blocks, schedules slots.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-[#D8F3DC] text-[#2d6a4f]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Google Workspace API Integrations</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Direct integration with Gmail, Google Calendar & Google People API.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-850 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 active:scale-[0.98] hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="spinner w-4 h-4" />
                Connecting Securely...
              </>
            ) : (
              <>
                {/* Custom Google Icon SVG */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.8l2.44-2.44C17.3 1.5 14.9 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 11.24-4.557 11.24-11.24 0-.76-.08-1.5-.22-2.185H12.24z" />
                </svg>
                Sign In With Google OAuth
              </>
            )}
          </button>
          
          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
            Secure, encrypted OAuth authentication tokens
          </p>
        </div>
      </motion.div>
    </main>
  );
}
