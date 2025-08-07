export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  created_at?: string;
}

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}