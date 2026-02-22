const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { connectDB, getMongoStatus } = require('./database.config');
require('dotenv').config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';
const FRONTEND_DIST_DIR = path.resolve(__dirname, '..', 'dist');

// Directory setup for JSON fallback
const DATA_DIR = path.join(__dirname, 'data');
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve frontend build when available (Render single-service deployment).
app.use(express.static(FRONTEND_DIST_DIR));

// Request logging middleware
app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`[RES] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });
  next();
});

// Ensure data directory exists
async function ensureDataDirectory() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// JSON file helpers for fallback storage
async function readJsonFile(filePath, defaultValue = []) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return defaultValue;
    throw err;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Initialize DB Connection
let mongoConnection = null;

async function initializeDatabase() {
  await ensureDataDirectory();
  mongoConnection = await connectDB();
}

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const { usersCollection, mongoReady } = getMongoStatus();
        
        if (mongoReady && usersCollection) {
            // MongoDB storage
            const existingUser = await usersCollection.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: { message: 'Username already taken' } });
            }
            const user = { username, password, createdAt: new Date().toISOString() };
            await usersCollection.insertOne(user);
            res.json({ data: { username: user.username } });
        } else {
            // JSON fallback storage
            const users = await readJsonFile(USERS_FILE, []);
            if (users.find(u => u.username === username)) {
                return res.status(400).json({ error: { message: 'Username already taken' } });
            }
            const user = { username, password, createdAt: new Date().toISOString() };
            users.push(user);
            await writeJsonFile(USERS_FILE, users);
            res.json({ data: { username: user.username } });
        }
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const { usersCollection, mongoReady } = getMongoStatus();
        
        if (mongoReady && usersCollection) {
            // MongoDB storage
            const user = await usersCollection.findOne({ username });
            if (!user || user.password !== password) {
                return res.status(401).json({ error: { message: 'Invalid credentials' } });
            }
            res.json({ data: { username: user.username } });
        } else {
            // JSON fallback storage
            const users = await readJsonFile(USERS_FILE, []);
            const user = users.find(u => u.username === username);
            if (!user || user.password !== password) {
                return res.status(401).json({ error: { message: 'Invalid credentials' } });
            }
            res.json({ data: { username: user.username } });
        }
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

// --- Entries Routes ---
app.get('/api/entries', async (req, res) => {
    try {
        const { username } = req.query;
        const { chatEntriesCollection, mongoReady } = getMongoStatus();
        
        if (mongoReady && chatEntriesCollection) {
            // MongoDB storage
            const entries = await chatEntriesCollection
                .find({ username })
                .sort({ timestamp: -1 })
                .toArray();
            res.json({ data: entries });
        } else {
            // JSON fallback storage
            const allEntries = await readJsonFile(ENTRIES_FILE, []);
            const entries = allEntries
                .filter(e => e.username === username)
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            res.json({ data: entries });
        }
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

app.post('/api/entries', async (req, res) => {
    try {
        const { chatEntriesCollection, mongoReady } = getMongoStatus();
        const entryData = req.body;
        
        if (mongoReady && chatEntriesCollection) {
            // MongoDB storage
            await chatEntriesCollection.insertOne(entryData);
            res.json({ data: entryData });
        } else {
            // JSON fallback storage
            const entries = await readJsonFile(ENTRIES_FILE, []);
            entries.push(entryData);
            await writeJsonFile(ENTRIES_FILE, entries);
            res.json({ data: entryData });
        }
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

app.put('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { chatEntriesCollection, mongoReady } = getMongoStatus();
        
        if (mongoReady && chatEntriesCollection) {
            // MongoDB storage - use the client-side id field
            const updated = await chatEntriesCollection.findOneAndUpdate(
                { id: id },
                { $set: req.body },
                { returnDocument: 'after' }
            );
            res.json({ data: updated });
        } else {
            // JSON fallback storage
            const entries = await readJsonFile(ENTRIES_FILE, []);
            const index = entries.findIndex(e => e.id === id);
            if (index === -1) {
                return res.status(404).json({ error: { message: 'Entry not found' } });
            }
            entries[index] = { ...entries[index], ...req.body };
            await writeJsonFile(ENTRIES_FILE, entries);
            res.json({ data: entries[index] });
        }
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

app.delete('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { chatEntriesCollection, mongoReady } = getMongoStatus();
        
        if (mongoReady && chatEntriesCollection) {
            // MongoDB storage
            await chatEntriesCollection.deleteOne({ id: id });
            res.json({ success: true });
        } else {
            // JSON fallback storage
            const entries = await readJsonFile(ENTRIES_FILE, []);
            const index = entries.findIndex(e => e.id === id);
            if (index === -1) {
                return res.status(404).json({ error: { message: 'Entry not found' } });
            }
            entries.splice(index, 1);
            await writeJsonFile(ENTRIES_FILE, entries);
            res.json({ success: true });
        }
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

// SPA fallback for non-API routes (excluding static assets).
app.get(/^(?!\/api\/|.*\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$).*/, async (_req, res) => {
    try {
        const indexPath = path.join(FRONTEND_DIST_DIR, 'index.html');
        await fs.access(indexPath);
        res.sendFile(indexPath);
    } catch {
        res.status(404).json({
            error: {
                message: 'Frontend build not found. Run `npm run build` from the project root before starting the server in production.'
            }
        });
    }
});

// --- Start Server ---
initializeDatabase().then(() => {
    app.listen(PORT, HOST, () => {
        console.log('[EVENT] Server started');
        console.log(`[EVENT] Listening on http://${HOST}:${PORT}`);
        const { mongoReady } = getMongoStatus();
        if (mongoReady) {
            console.log('[EVENT] Using MongoDB storage');
        } else {
            console.log('[EVENT] Using local JSON storage');
        }
    });
}).catch(err => {
    console.error('[ERROR] Failed to initialize database:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('[EVENT] Received SIGINT, shutting down...');
    const { mongoClient } = getMongoStatus();
    if (mongoClient) {
        try {
            await mongoClient.close();
            console.log('[EVENT] MongoDB connection closed');
        } catch (err) {
            console.error('[ERROR] Error closing MongoDB:', err);
        }
    }
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error(`[ERROR] Uncaught exception: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
    const message = reason && reason.message ? reason.message : String(reason);
    console.error(`[ERROR] Unhandled rejection: ${message}`);
});
