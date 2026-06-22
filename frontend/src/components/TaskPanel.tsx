'use client';

import React, { useState } from 'react';
import { Task } from '../types';
import { api } from '../lib/api';
import { CheckSquare, Square, Trash2, Calendar, AlertCircle, Plus, Sparkles } from 'lucide-react';

interface TaskPanelProps {
  tasks: Task[];
  onTasksChanged: () => void;
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

export default function TaskPanel({ tasks, onTasksChanged }: TaskPanelProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newDeadline, setNewDeadline] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleToggle = async (task: Task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      onTasksChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTask(id);
      onTasksChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.createTask({
        title: newTitle,
        priority: newPriority,
        deadline: newDeadline ? new Date(newDeadline).toISOString() : null,
        status: 'Pending'
      });
      setNewTitle('');
      setNewDeadline('');
      setIsAdding(false);
      onTasksChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'High') return 'text-rose-650 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
    if (p === 'Medium') return 'text-amber-650 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    return 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-850/40 dark:text-slate-400 dark:border-slate-800/40';
  };

  return (
    <div className="glass-card p-6 border-white/20 bg-white/50 dark:bg-slate-900/15 h-full flex flex-col justify-between">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 pb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#BDE0FE]" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Inbox Action Items</h3>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Task Form */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/40 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Task title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#CDB4DB]"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 focus:outline-none text-slate-500 dark:text-slate-300"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-slate-800 dark:bg-slate-750 text-white rounded-xl text-xs font-bold hover:bg-slate-900 dark:hover:bg-slate-700 transition-all"
            >
              Add Action Item
            </button>
          </form>
        )}

        {/* Tasks List */}
        <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium text-center py-8">No action items extracted. All caught up!</p>
          ) : (
            tasks.map(task => {
              const isCompleted = task.status === 'Completed';
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex items-start justify-between gap-3 ${
                    isCompleted
                      ? 'bg-slate-50/50 dark:bg-slate-950/10 border-slate-200/30 dark:border-slate-900/20 opacity-60'
                      : 'bg-white/70 dark:bg-slate-900/30 border-white/40 dark:border-slate-800/35 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggle(task)}
                      className="mt-0.5 text-[#BDE0FE] hover:text-[#CDB4DB] transition-colors shrink-0"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-5 h-5 fill-current text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>
                    <div>
                      <p className={`text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </p>
                      {task.description && !isCompleted && (
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {renderDescriptionWithLinks(task.description)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-semibold border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.deadline && (
                          <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                        {task.email_id && (
                          <span className="text-[9px] text-[#CDB4DB] font-semibold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI Extracted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-[10px] text-slate-400 font-semibold text-center border-t border-slate-100/50 dark:border-slate-800/40 pt-4 mt-6">
        Complete items to update dashboard trends
      </div>
    </div>
  );
}
