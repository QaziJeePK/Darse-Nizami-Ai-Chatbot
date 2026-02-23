export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}
