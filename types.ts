
export interface ChatEntry {
  id: string; // Client-side UUID
  _id?: string; // MongoDB ObjectID
  title: string;
  content: string;
  timestamp: number;
  dueDate?: string; // ISO date string (optional)
  priority?: 'low' | 'medium' | 'high';
  steps?: Array<{text: string; completed: boolean}>; // Action steps checklist
}

export interface User {
  username: string;
  password?: string;
}