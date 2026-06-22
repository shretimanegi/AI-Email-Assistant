'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { api } from '../../lib/api';
import { Calendar, Clock, Video, UserPlus, Check, Sparkles, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [proposedSlots, setProposedSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);
  const [bookedSlotIdx, setBookedSlotIdx] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.getUpcomingMeetings();
      setEvents(res);
      const slotsRes = await api.getProposedSlots();
      setProposedSlots(slotsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookMock = async (idx: number, summary: string, start: string, end: string, sender: string) => {
    setBooking(true);
    setBookedSlotIdx(idx);
    try {
      const res = await api.bookEvent({
        summary,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
        attendees: [sender || 'sarah.jenkins@growthflow.io']
      });
      if (res.success) {
        setBookedSuccess(true);
        setTimeout(() => {
          setBookedSuccess(false);
          setBookedSlotIdx(null);
          fetchEvents();
        }, 1500);
      } else {
        setBookedSlotIdx(null);
      }
    } catch (err) {
      console.error(err);
      setBookedSlotIdx(null);
    } finally {
      setBooking(false);
    }
  };

  const handleDeleteMeeting = async (eventId: string) => {
    setDeletingId(eventId);
    try {
      const success = await api.deleteEvent(eventId);
      if (success) {
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen pl-64 bg-[#FAFAFA] dark:bg-transparent">
      <Sidebar />
      <div className="flex flex-col h-screen overflow-hidden">
        <Header title="Meeting Calendar" />

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="spinner" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 flex gap-8">
            {/* Left Column: Calendar Feed */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="glass-card p-6 border-white/20 bg-white/50 dark:bg-slate-900/15">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#BDE0FE]" />
                  Upcoming Scheduled Meetings
                </h3>

                <div className="flex flex-col gap-3">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850/40 bg-white/70 dark:bg-slate-900/30 shadow-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-12 rounded-full"
                          style={{ backgroundColor: evt.color || '#CDB4DB' }}
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{evt.summary}</h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{evt.start} - {evt.end ? evt.end.split(' ')[1] : ''}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold px-2.5 py-1 rounded-lg">
                          Google Meet
                        </span>
                        <button
                          onClick={() => handleDeleteMeeting(evt.id)}
                          disabled={deletingId === evt.id}
                          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                          title="Delete Scheduled Meeting"
                        >
                          {deletingId === evt.id ? (
                            <div className="spinner w-3.5 h-3.5 border-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: AI Suggestions Panel */}
            <div className="w-80 flex flex-col gap-6 shrink-0">
              <div className="glass-card p-6 border-white/20 bg-gradient-to-tr from-white/60 to-[#BDE0FE]/10 dark:from-slate-900/50 dark:to-slate-800/20">
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#CDB4DB] fill-[#CDB4DB]/25" />
                  Proposed Time Slots
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mb-4 leading-normal">
                  Suggested slots extracted from meeting emails. Click to book on calendar instantly.
                </p>

                <div className="flex flex-col gap-3">
                  {proposedSlots.length === 0 ? (
                    <p className="text-[11px] text-slate-400 font-semibold text-center py-8">
                      No proposed meeting slots found in emails.
                    </p>
                  ) : (
                    proposedSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/10 border border-slate-200/50 shadow-sm flex flex-col gap-3"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{slot.summary}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-2">
                            {slot.formatted}
                          </p>
                        </div>

                        {bookedSuccess && bookedSlotIdx === idx ? (
                          <div className="w-full py-2 bg-emerald-100 text-emerald-800 text-center rounded-xl text-[10px] font-bold flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" /> Booked!
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBookMock(idx, slot.summary, slot.start, slot.end, slot.sender)}
                            disabled={booking}
                            className="w-full py-2 bg-black hover:bg-slate-900 dark:bg-black dark:hover:bg-slate-900 text-white rounded-xl text-[10px] font-bold transition-all disabled:opacity-50 hover:scale-[1.01] cursor-pointer"
                          >
                            {booking && bookedSlotIdx === idx ? 'Scheduling...' : 'Accept & Book'}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
