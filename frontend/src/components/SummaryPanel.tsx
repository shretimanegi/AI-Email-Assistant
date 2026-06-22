'use client';

import React, { useState } from 'react';
import { Email, Task } from '../types';
import { api } from '../lib/api';
import { BrainCircuit, Sparkles, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';

interface SummaryPanelProps {
  email: Email;
  tasks: Task[];
  onReEvaluate?: () => void;
}

const renderDescriptionWithLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const url = part.replace(/[.,;)!?]+$/, '');
      const trailing = part.slice(url.length);
      return (
        <React.Fragment key={index}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline font-semibold transition-colors break-all"
          >
            link
          </a>
          {trailing}
        </React.Fragment>
      );
    }
    return part;
  });
};

export default function SummaryPanel({ email, tasks, onReEvaluate }: SummaryPanelProps) {
  const [reEvaluating, setReEvaluating] = useState(false);
  const emailTasks = tasks.filter(t => t.email_id === email.id);

  const handleReEvaluate = async () => {
    setReEvaluating(true);
    try {
      const success = await api.reEvaluate(email.id);
      if (success && onReEvaluate) {
        onReEvaluate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReEvaluating(false);
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    if (sentiment === 'Positive') return 'Positive Tone Detected';
    if (sentiment === 'Negative') return 'Critical Response Flagged';
    return 'Neutral Sentiment';
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'Positive') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400';
    if (sentiment === 'Negative') return 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400';
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col justify-between border-white/20 bg-white/50 dark:bg-slate-900/15">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 pb-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-[#CDB4DB]" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">AI Co-pilot Analysis</h3>
          </div>
          
          <button
            onClick={handleReEvaluate}
            disabled={reEvaluating}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCcw className={`w-3 h-3 ${reEvaluating ? 'animate-spin' : ''}`} />
            {reEvaluating ? 'Analyzing...' : 'Re-analyze'}
          </button>
        </div>

        {/* Sentiment */}
        <div className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${getSentimentColor(email.sentiment)}`}>
          <Sparkles className="w-4 h-4" />
          {getSentimentLabel(email.sentiment)}
        </div>

        {/* AI Summary Section */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Executive Summary</h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-white/30 dark:bg-slate-900/20 p-4 rounded-2xl border border-white/40 dark:border-slate-800/40">
            {email.summary || 'AI Summary not generated. Hit Re-analyze to process.'}
          </p>
        </div>

        {/* Extracted Todos */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Extracted Tasks ({emailTasks.length})</h4>
          {emailTasks.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400/80" />
              <span>No immediate tasks detected in this email.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {emailTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white/40 border border-slate-100 dark:border-slate-800/40 dark:bg-slate-900/10 text-xs text-slate-600 dark:text-slate-300 shadow-sm"
                >
                  <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${task.priority === 'High' ? 'text-rose-400' : 'text-amber-400'}`} />
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">{task.title}</p>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        {renderDescriptionWithLinks(task.description)}
                      </p>
                    )}
                    {task.deadline && (
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-slate-400 font-semibold text-center border-t border-slate-100/50 dark:border-slate-800/40 pt-4">
        Powered by MailMind Agent Orchestrator
      </div>
    </div>
  );
}
