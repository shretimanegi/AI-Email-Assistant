'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import TaskPanel from '../../components/TaskPanel';
import { api } from '../../lib/api';
import { Task } from '../../types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasks(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen pl-64 bg-[#FAFAFA] dark:bg-transparent">
      <Sidebar />
      <div className="flex flex-col h-screen overflow-hidden">
        <Header title="Action Item Panel" />

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="spinner" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
            <div className="h-[600px]">
              <TaskPanel tasks={tasks} onTasksChanged={fetchTasks} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
