/// <reference types="vite/client" />
import { ChatEntry, User } from './types';
import { aiService } from './services/ai';

class HttpApiService {
    private currentUser: User | null = null;
    private baseUrl: string;

    constructor() {
        // Same-origin by default (works on Render when API and frontend are served together).
        // Optional override via VITE_API_URL for split deployments.
        const configuredBase = (import.meta.env.VITE_API_URL as string) || '';
        this.baseUrl = configuredBase.replace(/\/$/, '');
    }

    // --- Authentication ---
    async auth(username: string, password?: string, isSignup: boolean = false): Promise<User> {
        const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ username, password: password || 'default' }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Authentication failed');
        }
        
        const result = await response.json();
        this.currentUser = result.data;
        return this.currentUser;
    }

    async logout() {
        this.currentUser = null;
    }

    // --- Helper to get headers ---
    private getHeaders() {
        return {
            'Content-Type': 'application/json',
        };
    }

    // --- Data Management (HTTP to backend) ---
    async getEntries(username: string): Promise<ChatEntry[]> {
        const response = await fetch(`${this.baseUrl}/api/entries?username=${encodeURIComponent(username)}`, {
            headers: this.getHeaders(),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch entries: ${response.statusText}`);
        }
        const result = await response.json();
        const entries = result.data || [];
        // Ensure timestamp is a number
        return entries.map((entry: any) => ({
            ...entry,
            timestamp: entry.timestamp || Date.now(),
        }));
    }

    async createEntry(username: string, entry: Omit<ChatEntry, 'id' | 'timestamp'>): Promise<ChatEntry> {
        const payload = {
            id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            username: username,
            title: entry.title,
            content: entry.content,
            timestamp: Date.now(),
            dueDate: entry.dueDate,
            priority: entry.priority,
            steps: entry.steps,
        };
        const response = await fetch(`${this.baseUrl}/api/entries`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`Failed to create entry: ${response.statusText}`);
        }
        const result = await response.json();
        return result.data;
    }

    async updateEntry(username: string, entry: ChatEntry): Promise<void> {
        // Send the full entry with updated fields
        const payload = {
            id: entry.id,
            username: username,
            title: entry.title,
            content: entry.content,
            timestamp: entry.timestamp,
            dueDate: entry.dueDate,
            priority: entry.priority,
            steps: entry.steps,
        };
        const response = await fetch(`${this.baseUrl}/api/entries/${entry.id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`Failed to update entry: ${response.statusText}`);
        }
    }

    async deleteEntry(username: string, entry: ChatEntry): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/entries/${entry.id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
        if (!response.ok) {
            throw new Error(`Failed to delete entry: ${response.statusText}`);
        }
    }

    // --- JSON Export / Import ---
    exportToJson(entries: ChatEntry[]) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `gpt_library_export_${new Date().getTime()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    async importFromJson(username: string, file: File): Promise<ChatEntry[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsed = JSON.parse(content);
                    if (!Array.isArray(parsed)) {
                        throw new Error("Invalid JSON format. Expected an array of entries.");
                    }

                    // For each entry in the file, create it via the API
                    // (We could also implement a bulk import endpoint, but for simplicity we POST one by one)
                    const createdEntries: ChatEntry[] = [];
                    for (const entry of parsed) {
                        // Ensure required fields
                        if (!entry.title || !entry.content) continue;
                        const newEntry = await this.createEntry(username, {
                            title: entry.title,
                            content: entry.content,
                        });
                        createdEntries.push(newEntry);
                    }
                    resolve(createdEntries);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
    }

    // --- AI Wrapper (unchanged, uses aiService) ---
    async generateAICompletion(prompt: string, systemInstruction?: string): Promise<string> {
        return await aiService.generateCompletion(prompt, systemInstruction);
    }
}

// Export a single instance
export const api = new HttpApiService();