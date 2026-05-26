
import { ChatEntry, User } from './types';
import { aiService } from './services/ai';

class LocalStorageApiService {
    private currentUser: User | null = null;
    private STORAGE_KEY = 'gpt-chat-library-entries';

    private getStoredEntries(): Record<string, ChatEntry[]> {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    }

    private saveStoredEntries(data: Record<string, ChatEntry[]>) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    // --- Authentication ---
    async auth(username: string, password?: string, isSignup: boolean = false): Promise<User> {
        // No checks, just log the user in
        this.currentUser = { username };
        return this.currentUser;
    }

    async logout() {
        this.currentUser = null;
    }

    // --- Data Management (Local Storage) ---
    async getEntries(username: string): Promise<ChatEntry[]> {
        const data = this.getStoredEntries();
        return data[username] || [];
    }

    async createEntry(username: string, entry: ChatEntry): Promise<ChatEntry> {
        const data = this.getStoredEntries();
        if (!data[username]) data[username] = [];
        const newEntry = { ...entry, id: entry.id || crypto.randomUUID() };
        data[username].unshift(newEntry); // Add to beginning
        this.saveStoredEntries(data);
        return newEntry;
    }

    async updateEntry(username: string, entry: ChatEntry): Promise<void> {
        const data = this.getStoredEntries();
        if (!data[username]) return;
        const idToUse = entry._id || entry.id;
        data[username] = data[username].map(e => (e._id || e.id) === idToUse ? entry : e);
        this.saveStoredEntries(data);
    }

    async deleteEntry(username: string, entry: ChatEntry): Promise<void> {
        const data = this.getStoredEntries();
        if (!data[username]) return;
        const idToUse = entry._id || entry.id;
        data[username] = data[username].filter(e => (e._id || e.id) !== idToUse);
        this.saveStoredEntries(data);
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
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsed = JSON.parse(content);
                    if (!Array.isArray(parsed)) {
                        throw new Error("Invalid JSON format. Expected an array of entries.");
                    }
                    
                    const data = this.getStoredEntries();
                    if (!data[username]) data[username] = [];
                    
                    // Merge, avoiding duplicates by ID
                    const existingIds = new Set(data[username].map(e => e.id || e._id));
                    const newEntries = parsed.filter(e => !existingIds.has(e.id || e._id));
                    
                    data[username] = [...newEntries, ...data[username]];
                    this.saveStoredEntries(data);
                    resolve(data[username]);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
    }

    // --- AI Wrapper ---
    async generateAICompletion(prompt: string, systemInstruction?: string): Promise<string> {
        return await aiService.generateCompletion(prompt, systemInstruction);
    }
}

export const api = new LocalStorageApiService();
