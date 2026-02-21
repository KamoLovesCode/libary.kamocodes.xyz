# ✅ Setup Checklist - GPT Chat Library

## Quick Setup Guide

### 1. ✅ Dependencies Installed

**Backend:**
```powershell
cd server
npm install
```

**Frontend:**
```powershell
npm install
```

### 2. ✅ Environment Configuration

**Backend** (`server/.env`):
```env
MONGO_ENABLED=true
MONGODB_URI=mongodb+srv://Admin:Ninemillionby30@mydb.df6jv0x.mongodb.net/?appName=MyDb
MONGODB_DB=connect-Ninemillionby30
PORT=3001
```

**Frontend** (`.env`):
```env
GEMINI_API_KEY=your_api_key_here
VITE_API_URL=http://localhost:3001
```

### 3. ✅ Test Backend Connection

```powershell
cd server
node server.js
```

**Expected Output:**
```
✅ MongoDB connected (connect-Ninemillionby30)
[EVENT] Server started
[EVENT] Listening on http://0.0.0.0:3001
[EVENT] Using MongoDB storage
```

**Test API:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/entries?username=test" -UseBasicParsing
```

**Expected Response:**
```json
{"data":[]}
```

### 4. ✅ Start Application

**Option A - Manual (Recommended for first time):**

Terminal 1:
```powershell
cd server
npm start
```

Terminal 2:
```powershell
npm run dev
```

**Option B - Automatic:**
```powershell
.\start.ps1
# or
start.bat
```

### 5. ✅ Verify Frontend

1. Open http://localhost:3000
2. You should see the **Sign Up / Sign In** page
3. Create a new account:
   - Username: `testuser`
   - Password: `test123`
4. Click "Sign Up"

### 6. ✅ Test Data Flow

1. **Create a Note:**
   - Type something in the text area
   - Click "Save Note"
   - ✅ Note should appear in "Recent Notes"

2. **Check MongoDB:**
   - Go to MongoDB Atlas
   - View `chatEntries` collection
   - ✅ Your note should be there

3. **Verify Persistence:**
   - Refresh the page
   - Login again
   - ✅ Your notes should still be there

### 7. ✅ Test API Integration

**Create Entry Test:**
```powershell
$body = @{
    id = "test_123"
    username = "testuser"
    title = "Test Note"
    content = "This is a test"
    timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/entries" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

**Get Entries Test:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/entries?username=testuser" -UseBasicParsing | Select-Object -ExpandProperty Content
```

### 8. ✅ Test Authentication

**Sign Up Test:**
```powershell
$body = @{
    username = "john"
    password = "secret123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signup" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

**Login Test:**
```powershell
$body = @{
    username = "john"
    password = "secret123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

## ✅ Verification Checklist

- [ ] Backend server starts without errors
- [ ] MongoDB connection successful (or JSON fallback)
- [ ] Frontend loads at http://localhost:3000
- [ ] Can create a new account
- [ ] Can login with existing account
- [ ] Can create a new note
- [ ] Notes persist after refresh
- [ ] Notes visible in MongoDB Atlas
- [ ] Can edit a note
- [ ] Can delete a note
- [ ] Can export notes to JSON
- [ ] Can import notes from JSON

## 🐛 Common Issues

### Port Already in Use
```powershell
Get-NetTCPConnection -LocalPort 3001 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force
```

### MongoDB Connection Failed
- ✅ Server will use JSON storage as fallback
- Check `server/data/` folder
- Verify MongoDB URI in `server/.env`

### Frontend Can't Connect to Backend
- Verify backend is running on port 3001
- Check `VITE_API_URL` in `.env`
- Make sure CORS is enabled (it is by default)

### Authentication Fails
- Check server console for error messages
- Verify username and password are provided
- Try creating a new account

## 📊 Data Check

**View MongoDB Data:**
1. Go to MongoDB Atlas
2. Navigate to your cluster
3. Click "Browse Collections"
4. Check `connect-Ninemillionby30` database
5. View `chatEntries` and `users` collections

**View JSON Data (if MongoDB is disabled):**
```powershell
# View entries
Get-Content server/data/entries.json | ConvertFrom-Json | Format-Table

# View users
Get-Content server/data/users.json | ConvertFrom-Json | Format-Table
```

## ✅ All Set!

If all checks pass, your application is fully functional and ready to use!

**Next Steps:**
- Start creating and organizing notes
- Try the AI features (requires Gemini API key)
- Export your data regularly as backup
- Explore themes and customization options

---

**Need Help?**
- Check [README.md](README.md) for detailed documentation
- Check [server/README.md](server/README.md) for backend details
- Review error messages in the console
