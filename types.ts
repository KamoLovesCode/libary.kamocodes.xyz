
export interface ChatEntry {
  id: string; // Client-side UUID
  _id?: string; // MongoDB ObjectID
  title: string;
  content: string;
  timestamp: number;
  dueDate?: string; // ISO date string (optional)
  priority?: 'low' | 'medium' | 'high';
}

export interface User {
  username: string;
  password?: string;
}