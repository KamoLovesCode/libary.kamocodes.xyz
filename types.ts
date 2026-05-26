
export interface ChatEntry {
  id: string; // Client-side UUID
  _id?: string; // MongoDB ObjectID
  title: string;
  content: string;
  timestamp: number;
}

export interface User {
  username: string;
  password?: string;
}