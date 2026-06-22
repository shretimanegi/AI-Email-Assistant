'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { api } from '../../lib/api';
import { UserMemory } from '../../types';
import { Settings, Volume2, Calendar, ShieldAlert, Check, Users, BrainCircuit } from 'lucide-react';

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Local state form fields
  const [tone, setTone] = useState('Professional');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
    api.getSettings().then(res => {
      setPrefs(res);
      setTone(res.tone_preference);
      setStartTime(res.preferred_meeting_times.start);
      setEndTime(res.preferred_meeting_times.end);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSettings({
        tone_preference: tone,
        preferred_meeting_times: {
          start: startTime,
          end: endTime,
          days: prefs?.preferred_meeting_times.days || [1,2,3,4,5]
        },
        api_keys_encrypted: geminiKey ? { gemini: geminiKey } : {}
      });
      setPrefs(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const tonesList = ['Professional', 'Casual', 'Friendly', 'Short', 'Detailed'];

  return (
    <div className="min-h-screen pl-64 bg-[#FAFAFA] dark:bg-transparent">
      <Sidebar />
      <div className="flex flex-col h-screen overflow-hidden">
        <Header title="Agent Personalization Settings" />

        {loading || !prefs ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="spinner" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {/* Card 1: Tone preferences */}
              <div className="glass-card p-6 border-white/20 bg-white/50 dark:bg-slate-900/15">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-[#CDB4DB]" />
                  Writing Tone Personalization
                </h3>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">Default Response Draft Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 focus:outline-none focus:ring-1 focus:ring-[#CDB4DB] w-full max-w-md font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {tonesList.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    The Smart Reply agent drafts its primary recommended reply in this styling.
                  </p>
                </div>
              </div>

              {/* Card 2: Scheduling Availability */}
              <div className="glass-card p-6 border-white/20 bg-white/50 dark:bg-slate-900/15">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#BDE0FE]" />
                  Calendar Booking Constraints
                </h3>

                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Preferred Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 focus:outline-none focus:ring-1 focus:ring-[#CDB4DB] text-slate-750 dark:text-slate-200 font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Preferred End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 focus:outline-none focus:ring-1 focus:ring-[#CDB4DB] text-slate-750 dark:text-slate-200 font-bold"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-3">
                  The Scheduling Agent proposes available times only within these daily work hours boundaries.
                </p>
              </div>

              {/* Card 3: Custom Keys */}
              <div className="glass-card p-6 border-white/20 bg-white/50 dark:bg-slate-900/15">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-[#FFC8DD]" />
                  Custom Model Access
                </h3>

                <div className="flex flex-col gap-2 max-w-md">
                  <label className="text-xs font-semibold text-slate-400">Gemini API Key (Optional)</label>
                  <input
                    type="password"
                    placeholder="AQ.Ab8..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 focus:outline-none focus:ring-1 focus:ring-[#CDB4DB] text-slate-700 dark:text-slate-200 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Provide a custom API key to run agent evaluations on your own Gemini quota. Leaves empty to use defaults.
                  </p>
                </div>
              </div>

              {/* Card 4: Contact Memory */}
              <div className="glass-card p-6 border-white/20 bg-white/50 dark:bg-slate-900/15">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#D8F3DC] text-emerald-800" />
                  Learned Contacts Index
                </h3>

                <div className="flex flex-col gap-2 text-xs">
                  {Object.entries(prefs.learned_contacts_memory).length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold">Memory is blank. Agents build contact logs as you process emails.</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-w-md">
                      {Object.entries(prefs.learned_contacts_memory).map(([email, rule]) => (
                        <div key={email} className="p-3 rounded-xl bg-white/40 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
                          <span className="font-bold text-slate-650 dark:text-slate-300 truncate max-w-[180px]">{email}</span>
                          <span className="text-[10px] bg-[#BDE0FE]/30 text-indigo-850 dark:bg-[#BDE0FE]/10 dark:text-[#BDE0FE] px-2 py-0.5 rounded-lg font-bold">
                            {rule.nickname || 'Frequent Contact'} (Offset +{rule.importance_offset || 0})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Save Trigger */}
              <div className="flex items-center gap-4 mt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-black hover:bg-slate-900 dark:bg-black dark:hover:bg-slate-900 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  {saving ? 'Saving changes...' : 'Save Agent Preferences'}
                </button>

                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Preferences updated.
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
