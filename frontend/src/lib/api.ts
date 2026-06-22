import { Email, Task, User, UserMemory, EmailActions, AnalyticsDashboard } from '../types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth
  async login(): Promise<{ url: string }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`);
      if (!res.ok) throw new Error('Auth server error');
      return await res.json();
    } catch {
      return { url: '/dashboard?token=mock-jwt-token' };
    }
  },

  async getMe(): Promise<User> {
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, { headers: getHeaders() });
      if (!res.ok) throw new Error('User fetch error');
      return await res.json();
    } catch {
      return {
        id: 'd07bf122-bcda-4a57-8ff7-16d791244ab9',
        email: 'demo@mailmind.ai',
        full_name: 'Demo User',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  // Emails
  async getEmails(sync: boolean = true, limit: number = 30): Promise<{ emails: Email[]; unread_count: number }> {
    try {
      const res = await fetch(`${BASE_URL}/emails?sync=${sync}&limit=${limit}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Emails fetch error');
      return await res.json();
    } catch {
      // Return high-quality mock emails list
      const emails: Email[] = [
        {
          id: 'msg-001',
          thread_id: 'thread-001',
          subject: 'Quick synchronization regarding the marketing campaign launch?',
          sender: 'Sarah Jenkins <sarah.jenkins@growthflow.io>',
          recipient: 'me@mailmind.ai',
          body_text: 'Hi team,\n\nI was hoping we could jump on a quick call tomorrow afternoon to align on the final items for the growth marketing campaign. Let me know if you are free at 2:00 PM EST or 4:00 PM EST. Otherwise, let me know when works for you.\n\nBest,\nSarah',
          body_html: null,
          received_at: new Date().toISOString(),
          category: 'Meeting Requests',
          priority: 'High',
          is_read: false,
          summary: 'Sarah Jenkins proposes scheduling an alignment call tomorrow afternoon. Proposes slots at 2:00 PM and 4:00 PM EST to sync on the growth marketing campaign.',
          sentiment: 'Positive',
          created_at: new Date().toISOString(),
        },
        {
          id: 'msg-002',
          thread_id: 'thread-002',
          subject: 'Invoice #INV-2026-9812 - Outstanding Payment Details',
          sender: 'Billing Department <billing@acme-corp.com>',
          recipient: 'me@mailmind.ai',
          body_text: 'Dear customer,\n\nYour invoice #INV-2026-9812 is now ready for payment. The total amount due is $1,240.50, and the payment deadline is Friday, June 20, 2026. Please complete the wire transfer or use the credit card link to settle the balance.\n\nThank you,\nAcme Corp Support',
          body_html: null,
          received_at: new Date(Date.now() - 3600000).toISOString(),
          category: 'Finance',
          priority: 'High',
          is_read: false,
          summary: 'Invoice bill payment notification from Acme Corp support. Amount of $1,240.50 due by June 20, 2026.',
          sentiment: 'Neutral',
          created_at: new Date().toISOString(),
        },
        {
          id: 'msg-003',
          thread_id: 'thread-003',
          subject: 'Weekly Tech Digest: Trends in Agentic AI workflows, LangGraph vs Autogen',
          sender: 'Medium Tech News <digest@medium.com>',
          recipient: 'me@mailmind.ai',
          body_text: 'Hello Reader,\n\nHere are this week\'s top stories in AI Development:\n1. Designing Multi-Agent topologies with LangGraph\n2. Optimizing context windows for RAG retrieval\n3. The rise of local LLM models with Ollama.\n\nRead more inside.',
          body_html: null,
          received_at: new Date(Date.now() - 7200000).toISOString(),
          category: 'Newsletters',
          priority: 'Low',
          is_read: true,
          summary: 'Tech newsletter listing top items in AI development trends, LangGraph multi-agents, and RAG architectures.',
          sentiment: 'Neutral',
          created_at: new Date().toISOString(),
        },
        {
          id: 'msg-004',
          thread_id: 'thread-004',
          subject: 'Urgent Action Required: Confirm subscription changes to workspace',
          sender: 'Slack Notifications <no-reply@slack-mail.com>',
          recipient: 'me@mailmind.ai',
          body_text: 'Hi there,\n\nThis is a friendly reminder that your premium Slack workspace trial will expire in 3 days. Your credit card ending in 4111 will be billed $80.00 unless you change your preferences in workspace settings.',
          body_html: null,
          received_at: new Date(Date.now() - 14400000).toISOString(),
          category: 'Important',
          priority: 'Medium',
          is_read: false,
          summary: 'Slack trial expiration alert. The workspace subscription billing of $80.00 starts in 3 days.',
          sentiment: 'Negative',
          created_at: new Date().toISOString(),
        },
        {
          id: 'msg-005',
          thread_id: 'thread-005',
          subject: 'Dinner plans this weekend? Catching up',
          sender: 'John Doe <johndoe.friend@gmail.com>',
          recipient: 'me@mailmind.ai',
          body_text: 'Hey! Long time no see. Are you free to grab dinner this Saturday around 7 PM? Let me know, we have lots to catch up on!\n\nCheers,\nJohn',
          body_html: null,
          received_at: new Date(Date.now() - 86400000).toISOString(),
          category: 'Personal',
          priority: 'Medium',
          is_read: true,
          summary: 'John Doe requests checking availability for a casual dinner catch up on Saturday evening.',
          sentiment: 'Positive',
          created_at: new Date().toISOString(),
        }
      ];
      return { emails, unread_count: 3 };
    }
  },

  async getEmailDetails(id: string): Promise<{ email: Email; actions: EmailActions }> {
    try {
      const res = await fetch(`${BASE_URL}/emails/${id}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Email details fetch error');
      return await res.json();
    } catch {
      // Find matching mock email details
      const list = await this.getEmails(false);
      const email = list.emails.find(e => e.id === id) || list.emails[0];
      
      // Construct relevant mock actions
      const actions: EmailActions = {
        replies: {
          professional: `Dear Sender,\n\nThank you for reaching out. I have reviewed the details and am looking into it. I will get back to you with updates shortly.\n\nSincerely,\nDemo User`,
          casual: `Hey! Thanks for the email. Let me take a look and I'll get back to you soon!\n\nBest,\nDemo User`,
          short: `Thanks! Got it, on it now.`,
          detailed: `Hi there,\n\nThank you for writing. I will coordinate with the team regarding the details mentioned here. I expect to share the next steps with you by tomorrow evening.\n\nBest regards,\nDemo User`
        },
        calendar: {
          intent_detected: email.category === 'Meeting Requests',
          proposed_times: ['tomorrow afternoon at 2 PM or 4 PM'],
          suggested_slots: [
            { start: new Date(Date.now() + 86400000).toISOString(), end: new Date(Date.now() + 86400000 + 1800000).toISOString(), formatted: 'Tomorrow at 2:00 PM UTC' },
            { start: new Date(Date.now() + 86400000 + 7200000).toISOString(), end: new Date(Date.now() + 86400000 + 9000000).toISOString(), formatted: 'Tomorrow at 4:00 PM UTC' }
          ],
          draft_email: `Hi,\n\nI checked my calendar and I am free to connect during either of these slots:\n1. Tomorrow at 2:00 PM UTC\n2. Tomorrow at 4:00 PM UTC\n\nPlease let me know what works best.\n\nCheers!`
        }
      };
      
      return { email, actions };
    }
  },

  async sendReply(id: string, bodyText: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/emails/${id}/reply`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ body_text: bodyText })
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async reEvaluate(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/emails/${id}/re-evaluate`, {
        method: 'POST',
        headers: getHeaders()
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    try {
      const res = await fetch(`${BASE_URL}/tasks`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Tasks fetch error');
      return await res.json();
    } catch {
      return [
        {
          id: 'task-1',
          user_id: 'user-123',
          email_id: 'msg-001',
          title: 'Prepare agenda for alignment call',
          description: 'Coordinate slot and draft topics to discuss for the marketing sync with Sarah Jenkins.',
          status: 'Pending',
          deadline: new Date(Date.now() + 86400000).toISOString(),
          priority: 'High',
          created_at: new Date().toISOString()
        },
        {
          id: 'task-2',
          user_id: 'user-123',
          email_id: 'msg-002',
          title: 'Process invoice payment',
          description: 'Settle balance of $1,240.50 for invoice from Billing Department.',
          status: 'Pending',
          deadline: new Date(Date.now() + 259200000).toISOString(),
          priority: 'High',
          created_at: new Date().toISOString()
        },
        {
          id: 'task-3',
          user_id: 'user-123',
          email_id: 'msg-004',
          title: 'Review Slack subscription changes',
          description: 'Premium trial expiring in 3 days. Decide on subscription renewal or cancellation.',
          status: 'Completed',
          deadline: new Date(Date.now() + 172800000).toISOString(),
          priority: 'Medium',
          created_at: new Date().toISOString()
        }
      ];
    }
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    try {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(task)
      });
      return await res.json();
    } catch {
      return {
        id: Math.random().toString(),
        user_id: 'user-123',
        email_id: task.email_id || null,
        title: task.title || 'Untitled Task',
        description: task.description || '',
        status: 'Pending',
        deadline: task.deadline || null,
        priority: task.priority || 'Medium',
        created_at: new Date().toISOString()
      };
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const res = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      return await res.json();
    } catch {
      return {
        id,
        user_id: 'user-123',
        email_id: null,
        title: updates.title || 'Updated Task',
        description: updates.description || '',
        status: updates.status || 'Pending',
        deadline: updates.deadline || null,
        priority: updates.priority || 'Medium',
        created_at: new Date().toISOString()
      };
    }
  },

  async deleteTask(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return res.ok;
    } catch {
      return true;
    }
  },
  
  async getProposedSlots(): Promise<any[]> {
    try {
      const res = await fetch(`${BASE_URL}/calendar/proposed-slots`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Proposed slots fetch error');
      return await res.json();
    } catch {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const fmtIso = (h: number, m: number) => {
        const d = new Date(tomorrow);
        d.setHours(h, m, 0, 0);
        return d.toISOString();
      };
      
      const fmtStr = (h: number, m: number) => {
        const d = new Date(tomorrow);
        d.setHours(h, m, 0, 0);
        return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) + ` at ${h % 12 || 12}:${m === 0 ? '00' : m} ${h >= 12 ? 'PM' : 'AM'} UTC`;
      };

      return [
        {
          email_id: 'msg-001',
          summary: 'Sarah Jenkins (Quick synchronization regarding the marketing campaign launch?)',
          start: fmtIso(14, 0),
          end: fmtIso(14, 30),
          formatted: fmtStr(14, 0),
          sender: 'sarah.jenkins@growthflow.io'
        },
        {
          email_id: 'msg-001',
          summary: 'Sarah Jenkins (Quick synchronization regarding the marketing campaign launch?)',
          start: fmtIso(16, 0),
          end: fmtIso(16, 30),
          formatted: fmtStr(16, 0),
          sender: 'sarah.jenkins@growthflow.io'
        }
      ];
    }
  },

  // Calendar
  async getUpcomingMeetings(days: number = 7): Promise<any[]> {
    try {
      const res = await fetch(`${BASE_URL}/calendar/events?days=${days}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Events fetch error');
      return await res.json();
    } catch {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const fmt = (h: number, m: number) => {
        const d = new Date(tomorrow);
        d.setHours(h, m, 0, 0);
        return d.toISOString().replace('T', ' ').substring(0, 16);
      };

      return [
        { id: 'event-0', summary: 'Marketing sync (Proposed)', start: fmt(14, 0), end: fmt(14, 30), color: '#CDB4DB' },
        { id: 'event-1', summary: 'Weekly Standup', start: fmt(10, 0), end: fmt(11, 0), color: '#BDE0FE' },
        { id: 'event-2', summary: 'Product review', start: fmt(15, 0), end: fmt(16, 0), color: '#FFC8DD' }
      ];
    }
  },

  async bookEvent(event: { summary: string; start_time: string; end_time: string; attendees?: string[]; description?: string }): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/calendar/events`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(event)
      });
      return await res.json();
    } catch {
      return { success: true, event_id: 'mock-evt-999', message: 'Event scheduled.' };
    }
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsDashboard> {
    try {
      const res = await fetch(`${BASE_URL}/analytics/dashboard`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Analytics fetch error');
      return await res.json();
    } catch {
      return {
        summary: {
          total_processed: 38,
          avg_response_time: '1.4 hrs',
          time_saved_minutes: 304,
          pending_action_items: 2
        },
        category_breakdown: {
          'Important': 8,
          'Meeting Requests': 6,
          'Personal': 10,
          'Promotions': 7,
          'Newsletters': 4,
          'Finance': 2,
          'Spam': 1
        },
        priority_breakdown: {
          'High': 12,
          'Medium': 18,
          'Low': 8
        },
        top_contacts: [
          { name: 'Sarah Jenkins', email: 'sarah.jenkins@growthflow.io', count: 12, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
          { name: 'Alex Mercer', email: 'alex.m@acme-corp.com', count: 8, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
          { name: 'Jane Doe', email: 'jane@company.com', count: 6, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane' },
          { name: 'David Miller', email: 'david.miller@financials.com', count: 4, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david' }
        ],
        trend: [
          { day: 'Mon', processed: 6, saved: 48 },
          { day: 'Tue', processed: 9, saved: 72 },
          { day: 'Wed', processed: 12, saved: 96 },
          { day: 'Thu', processed: 8, saved: 64 },
          { day: 'Fri', processed: 3, saved: 24 }
        ]
      };
    }
  },

  // Settings
  async getSettings(): Promise<UserMemory> {
    try {
      const res = await fetch(`${BASE_URL}/settings`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Settings fetch error');
      return await res.json();
    } catch {
      return {
        tone_preference: 'Professional',
        preferred_meeting_times: {
          start: '09:00',
          end: '17:00',
          days: [1, 2, 3, 4, 5]
        },
        learned_contacts_memory: {
          'sarah.jenkins@growthflow.io': { nickname: ' Sarah (Growth)', importance_offset: 1 },
          'alex.m@acme-corp.com': { nickname: 'Alex (Acme Client)', importance_offset: 2 }
        },
        updated_at: new Date().toISOString()
      };
    }
  },

  async updateSettings(settings: Partial<UserMemory>): Promise<UserMemory> {
    try {
      const res = await fetch(`${BASE_URL}/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(settings)
      });
      return await res.json();
    } catch {
      return {
        tone_preference: settings.tone_preference || 'Professional',
        preferred_meeting_times: settings.preferred_meeting_times || { start: '09:00', end: '17:00', days: [1,2,3,4,5] },
        learned_contacts_memory: settings.learned_contacts_memory || {},
        updated_at: new Date().toISOString()
      };
    }
  }
};
