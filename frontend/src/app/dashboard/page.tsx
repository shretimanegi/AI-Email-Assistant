'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import EmailCard from '../../components/EmailCard';
import SummaryPanel from '../../components/SummaryPanel';
import ReplyDrawer from '../../components/ReplyDrawer';
import { api } from '../../lib/api';
import { Email, Task, EmailActions, User } from '../../types';
import { Search, MailOpen, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const [emails, setEmails] = useState<Email[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedActions, setSelectedActions] = useState<EmailActions | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Parse token from URL query params (Google callback redirect)
  useEffect(() => {
    const token = searchParams.get('token');
    let shouldSync = false;

    if (token) {
      localStorage.setItem('auth_token', token);
      // Clean query parameters from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      shouldSync = true;
    } else {
      // Check if we already synced in this session
      const alreadySynced = sessionStorage.getItem('gmail_synced_this_session');
      if (!alreadySynced) {
        shouldSync = true;
      }
    }

    // Fetch user details immediately now that token is saved to localStorage
    api.getMe().then(setUser).catch(console.error);

    if (shouldSync) {
      sessionStorage.setItem('gmail_synced_this_session', 'true');
      fetchInitialData(true);
    } else {
      fetchInitialData(false);
    }
  }, [searchParams]);

  const fetchInitialData = async (sync = false) => {
    if (sync) setSyncing(true);
    else setLoading(true);

    try {
      const emailRes = await api.getEmails(sync);
      setEmails(emailRes.emails);
      
      const tasksRes = await api.getTasks();
      setTasks(tasksRes);

      // Auto-select first email if none selected
      if (emailRes.emails.length > 0 && !selectedEmail) {
        handleSelectEmail(emailRes.emails[0]);
      }
    } catch (err) {
      console.error('Failed to load initial dashboard data:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    setSelectedActions(null);
    setDetailsLoading(true);
    try {
      const details = await api.getEmailDetails(email.id);
      setSelectedEmail(details.email);
      setSelectedActions(details.actions);
      
      // Update read status locally in list
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
      
      // Refresh tasks
      const tasksRes = await api.getTasks();
      setTasks(tasksRes);
    } catch (err) {
      console.error('Failed to load email details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSync = () => {
    fetchInitialData(true);
  };

  const categories = ['All', 'Important', 'Meeting Requests', 'Personal', 'Promotions', 'Newsletters', 'Finance'];

  // Filter emails
  const filteredEmails = emails.filter(e => {
    const matchesSearch = 
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.body_text && e.body_text.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden flex-1">
      <Header title="Inbox Co-pilot" onSync={handleSync} syncing={syncing} user={user} />

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="spinner w-8 h-8" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Syncing inbox & running agents...</p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* COLUMN 1: Emails List */}
          <div className="w-[30%] border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col h-full bg-white/10 dark:bg-slate-900/10">
            {/* Search and filter header */}
            <div className="p-4 flex flex-col gap-3 border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-850/60 text-slate-750 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#CDB4DB]"
                />
              </div>
              
              {/* Horizontal Category Filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border shrink-0 transition-all ${
                      categoryFilter === cat
                        ? 'bg-black text-white border-transparent shadow-sm'
                        : 'bg-white/50 dark:bg-slate-900/30 border-slate-200/40 dark:border-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Emails scrolling pane */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredEmails.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <MailOpen className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400 font-semibold">No emails match your filters.</p>
                </div>
              ) : (
                filteredEmails.map(email => (
                  <EmailCard
                    key={email.id}
                    email={email}
                    isSelected={selectedEmail?.id === email.id}
                    onClick={() => handleSelectEmail(email)}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: AI Copilot Summary */}
          <div className="w-[36%] flex flex-col h-full bg-white/5 dark:bg-black/5 overflow-y-auto p-6 border-r border-slate-200/50 dark:border-slate-800/50">
            {detailsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center">AI Analyzing...</p>
              </div>
            ) : selectedEmail ? (
              <div className="flex flex-col gap-5 h-full">
                {/* Subject, Sender & Date Header Card */}
                <div className="glass-card p-4 flex items-center gap-3 bg-white/40 border border-slate-200/30 shadow-sm shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmail.sender.split('<')[0].replace(' ', '')}`}
                    alt="Sender Avatar"
                    className="w-10 h-10 rounded-xl bg-[#BDE0FE]/20"
                  />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xs font-black text-slate-850 truncate leading-snug">
                      {selectedEmail.subject}
                    </h1>
                    <h4 className="text-[10px] text-slate-500 font-semibold truncate mt-1">
                      From: <span className="font-bold text-slate-700">{selectedEmail.sender}</span>
                    </h4>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold self-start whitespace-nowrap">
                    {new Date(selectedEmail.received_at).toLocaleDateString()}
                  </span>
                </div>

                {/* AI Summary and Action Items */}
                <div className="flex-1 min-h-0">
                  <SummaryPanel
                    email={selectedEmail}
                    tasks={tasks}
                    onReEvaluate={() => handleSelectEmail(selectedEmail)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <MailOpen className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-bold">Select an email to view AI summary & actions</p>
              </div>
            )}
          </div>

          {/* COLUMN 3: Smart Reply Copilot */}
          <div className="w-[34%] h-full overflow-y-auto p-6 flex flex-col gap-4 bg-white/10 dark:bg-slate-900/10">
            {selectedEmail ? (
              selectedActions ? (
                <ReplyDrawer
                  email={selectedEmail}
                  actions={selectedActions}
                  onReplied={() => handleSelectEmail(selectedEmail)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center">Generating Smart Replies...</p>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <MailOpen className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-bold">Select an email to use Smart Reply Copilot</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen pl-64 bg-[#FAFAFA] dark:bg-transparent transition-colors duration-300">
      <Sidebar />
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center gap-3 h-screen">
          <div className="spinner w-8 h-8" />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Initializing Workspace...</p>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
