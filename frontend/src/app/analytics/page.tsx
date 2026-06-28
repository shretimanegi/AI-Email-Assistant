'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { api } from '../../lib/api';
import { AnalyticsDashboard } from '../../types';
import { BarChart3, TrendingUp, Users, Clock, Flame, Award } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pl-64 bg-[#FAFAFA] dark:bg-transparent">
      <Sidebar />
      <div className="flex flex-col h-screen overflow-hidden">
        <Header title="AI Performance Insights" />

        {loading || !data ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="spinner" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full">
            {/* Top row: Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="glass-card p-5 border-white/20 bg-white/50 dark:bg-slate-900/15 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#CDB4DB]/20 text-[#7d5c9c] dark:text-[#CDB4DB] flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Processed Volume</h4>
                  <p className="text-lg font-black text-slate-850 dark:text-white mt-0.5">{data.summary.total_processed} Emails</p>
                </div>
              </div>

              <div className="glass-card p-5 border-white/20 bg-white/50 dark:bg-slate-900/15 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#BDE0FE]/20 text-[#4c84b5] dark:text-[#BDE0FE] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Response</h4>
                  <p className="text-lg font-black text-slate-850 dark:text-white mt-0.5">{data.summary.avg_response_time}</p>
                </div>
              </div>

              <div className="glass-card p-5 border-white/20 bg-white/50 dark:bg-slate-900/15 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#D8F3DC]/30 text-[#2d6a4f] dark:bg-[#D8F3DC]/10 dark:text-[#86C495] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time Saved</h4>
                  <p className="text-lg font-black text-slate-850 dark:text-white mt-0.5">{data.summary.time_saved_minutes} Mins</p>
                </div>
              </div>

              <div className="glass-card p-5 border-white/20 bg-white/50 dark:bg-slate-900/15 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFC8DD]/20 text-[#bf6083] dark:text-[#FFC8DD] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Open Tasks</h4>
                  <p className="text-lg font-black text-slate-850 dark:text-white mt-0.5">{data.summary.pending_action_items} Pending</p>
                </div>
              </div>
            </div>

            {/* Middle Row: Trend & Category maps */}
            <div className="grid grid-cols-3 gap-6">
              {/* Trend Chart (Pure SVG) */}
              <div className="col-span-2 glass-card pt-6 px-6 pb-2 border-white/20 bg-white/50 dark:bg-slate-900/15 flex flex-col justify-between overflow-hidden">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4.5 h-4.5 text-[#CDB4DB]" />
                  Weekly Processing Volume
                </h3>
                
                {/* SVG Bar Chart */}
                <div className="w-full flex-1 flex flex-col px-4 mt-auto min-h-[160px] justify-end">
                  {/* Bars Container */}
                  <div 
                    className="w-full flex-1 flex items-end justify-between border-b border-slate-200/50 pb-0 mb-2"
                  >
                    {(() => {
                      const maxVal = Math.max(...data.trend.map(t => t.processed), 1);
                      return data.trend.map((t, idx) => {
                        const relativePercent = Math.round((t.processed / maxVal) * 100);
                        const barHeightPercent = relativePercent;
                        return (
                          <div 
                            key={idx} 
                            className="relative w-[12%] max-w-[36px] flex items-end group cursor-pointer"
                            style={{ height: `${barHeightPercent}%` }}
                          >
                            {/* Hover Tooltip */}
                            <div className="absolute -translate-y-12 bg-slate-850 text-white text-[9px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 left-1/2 -translate-x-1/2">
                              {relativePercent}% volume
                            </div>
                            {/* Bar */}
                            <div
                              className="w-full h-full rounded-t bg-gradient-to-t from-[#BDE0FE] to-[#CDB4DB] transition-all duration-300 group-hover:scale-y-105 origin-bottom"
                            />
                          </div>
                        );
                      });
                    })()}
                  </div>
                  {/* Day Labels Row */}
                  <div className="w-full flex justify-between mt-1">
                    {data.trend.map((t, idx) => (
                      <div key={idx} className="w-[12%] max-w-[36px] text-center">
                        <span className="text-[10px] text-slate-400 font-bold">{t.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Categories list */}
              <div className="glass-card p-6 border-white/20 bg-white/50 dark:bg-slate-900/15">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4.5 h-4.5 text-[#FFC8DD]" />
                  Category Distributions
                </h3>

                <div className="flex flex-col gap-3">
                  {Object.entries(data.category_breakdown).map(([category, count]) => {
                    const total = Object.values(data.category_breakdown).reduce((a, b) => a + b, 0);
                    const percent = total > 0 ? (count / total) * 100 : 0;
                    
                    return (
                      <div key={category} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-350">
                          <span>{category}</span>
                          <span>{count}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#FFC8DD] to-[#CDB4DB]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Row: Top Contacts */}
            <div className="glass-card p-6 border-white/20 bg-white/50 dark:bg-slate-900/15">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-[#BDE0FE]" />
                Most Contacted Connections
              </h3>

              <div className="grid grid-cols-4 gap-4">
                {data.top_contacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 flex items-center gap-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-white dark:border-slate-700/50"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{contact.name}</h4>
                      <p className="text-[9px] text-slate-400 font-semibold">{contact.count} threads</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
