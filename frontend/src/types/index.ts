export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  thread_id: string;
  subject: string;
  sender: string;
  recipient: string;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  category: 'Important' | 'Meeting Requests' | 'Personal' | 'Promotions' | 'Newsletters' | 'Finance' | 'Spam';
  priority: 'High' | 'Medium' | 'Low';
  is_read: boolean;
  summary: string | null;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  email_id: string | null;
  title: string;
  description: string | null;
  status: 'Pending' | 'Completed';
  deadline: string | null;
  priority: 'High' | 'Medium' | 'Low';
  created_at: string;
}

export interface UserMemory {
  tone_preference: string;
  preferred_meeting_times: {
    start: string;
    end: string;
    days: number[];
  };
  learned_contacts_memory: Record<string, {
    nickname?: string;
    importance_offset?: number;
  }>;
  api_keys_encrypted?: Record<string, string>;
  updated_at: string;
}

export interface EmailActions {
  replies: {
    professional: string;
    casual: string;
    short: string;
    detailed: string;
  };
  calendar: {
    intent_detected: boolean;
    proposed_times?: string[];
    suggested_slots?: Array<{
      start: string;
      end: string;
      formatted: string;
    }>;
    draft_email?: string;
  };
}

export interface AnalyticsDashboard {
  summary: {
    total_processed: number;
    avg_response_time: string;
    time_saved_minutes: number;
    pending_action_items: number;
  };
  category_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
  top_contacts: Array<{
    name: string;
    email: string;
    count: number;
    avatar: string;
  }>;
  trend: Array<{
    day: string;
    processed: number;
    saved: number;
  }>;
}
