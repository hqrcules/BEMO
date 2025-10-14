export interface SupportMessage {
  id: string;
  chat: string;
  user: string;
  user_email: string;
  message: string;
  attachment: string | null;
  attachment_url: string | null;
  is_from_admin: boolean;
  is_read: boolean;
  sender_name: string;
  created_at: string;
  read_at: string | null;
}

export interface SupportChat {
  id: string;
  user: string;
  user_email: string;
  user_full_name: string;
  assigned_admin: string | null;
  assigned_admin_email: string | null;
  status: 'open' | 'in_progress' | 'closed';
  subject: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  last_message: SupportMessage | null;
  unread_count_for_user: number;
  unread_count_for_admin: number;
  messages: SupportMessage[];
}

export interface AdminSupportStats {
  total_chats: number;
  open_chats: number;
  in_progress: number;
  closed_today: number;
  unread_messages: number;
}
