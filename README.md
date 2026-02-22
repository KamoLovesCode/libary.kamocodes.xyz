<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GPT Chat Library - Full Stack Application

A modern full-stack note-taking and AI-assisted workspace application with MongoDB cloud storage.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key (for AI features)

### Installation & Setup

1. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

2. **Configure Backend**
   
   Edit `server/.env`:
   ```env
   MONGO_ENABLED=true
   MONGODB_URI=mongodb+srv://Admin:Ninemillionby30@mydb.df6jv0x.mongodb.net/?appName=MyDb
   MONGODB_DB=connect-Ninemillionby30
   PORT=3001
   ```

3. **Configure Frontend**
   
   Edit `.env` in root:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_HF_TOKEN=your_huggingface_token_here
   # Optional only when frontend and API are split across domains
   # VITE_API_URL=https://your-api-domain.onrender.com
   ```

4. **Start the Application**

   **Terminal 1 - Backend:**
   ```bash
   cd server
   npm start
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```

5. **Access**: http://localhost:3000

## 🔐 Features

✅ **User Authentication** - Secure signup/login with MongoDB  
✅ **Cloud Storage** - MongoDB Atlas integration with JSON fallback  
✅ **AI Features** - Summarization, editing, voice input (Gemini)  
✅ **Rich Markdown** - Full markdown editor and preview  
✅ **Export/Import** - JSON backup and restore  
✅ **Themes** - Light/Dark mode with 5+ accent colors  

## 📁 Architecture

**Frontend** (React + TypeScript + Vite)
- Port: 3000
- Components: React functional components
- State: React hooks
- API Client: Fetch API wrapper

**Backend** (Node.js + Express)
- Port: 3001
- Database: MongoDB with JSON fallback
- Storage: Cloud (MongoDB) + Local (JSON)
- CORS: Enabled for all origins

## 🔧 API Endpoints

**Auth:**
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

**Entries:**
- `GET /api/entries?username=<user>` - Get all entries
- `POST /api/entries` - Create entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

## 🐛 Troubleshooting

**Port in use:**
```powershell
Get-NetTCPConnection -LocalPort 3001 | Select -ExpandProperty OwningProcess | Stop-Process -Force
```

**MongoDB connection fails:**
- Server automatically falls back to JSON storage
- Check `server/data/` folder for local storage

**Test API:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/entries?username=test" -UseBasicParsing
```

## 📦 Deployment

**Frontend:** Vercel/Netlify (deploy `dist/`)  
**Backend:** Railway/Render (deploy `server/`)  

Set `VITE_API_URL` to your backend URL.

### Render (single service) recommended

- Build Command: `npm install && npm --prefix server install && npm run build`
- Start Command: `npm start`
- Required env vars: `MONGO_ENABLED`, `MONGODB_URI`, `MONGODB_DB`, `VITE_GEMINI_API_KEY`
- Optional env vars: `VITE_HF_TOKEN`, `VITE_API_URL` (only for split deployments)

## 📝 License

MIT License

---

View in AI Studio: https://ai.studio/apps/c8a8cdb4-b0e8-44cb-8576-86c76e8b231f
