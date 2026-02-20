
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./database.config');

const User = require('./models/User');
const ChatEntry = require('./models/ChatEntry');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Initialize DB Connection
connectDB();

// Middleware to ensure DB is connected
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: { message: 'Database not connected' } });
    }
    next();
});

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (await User.findOne({ username })) {
            return res.status(400).json({ error: { message: 'Username already taken' } });
        }
        const user = await User.create({ username, password });
        res.json({ data: user });
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: { message: 'Invalid credentials' } });
        }
        res.json({ data: user });
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

// --- Entries Routes ---
app.get('/api/entries', async (req, res) => {
    try {
        const { username } = req.query;
        const entries = await ChatEntry.find({ username }).sort({ timestamp: -1 });
        res.json({ data: entries });
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

app.post('/api/entries', async (req, res) => {
    try {
        const entry = await ChatEntry.create(req.body);
        res.json({ data: entry });
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

app.put('/api/entries/:id', async (req, res) => {
    try {
        // Update by MongoDB _id OR Client id
        const { id } = req.params;
        const query = mongoose.isValidObjectId(id) ? { _id: id } : { id: id };
        
        const updated = await ChatEntry.findOneAndUpdate(query, req.body, { new: true });
        res.json({ data: updated });
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

app.delete('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = mongoose.isValidObjectId(id) ? { _id: id } : { id: id };
        await ChatEntry.findOneAndDelete(query);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
