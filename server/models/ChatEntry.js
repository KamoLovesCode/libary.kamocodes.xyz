
const mongoose = require('mongoose');

const ChatEntrySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Client UUID
  username: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatEntry', ChatEntrySchema);
