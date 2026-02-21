# GPT Chat Library - Server Setup

## MongoDB Integration with Fallback to Local JSON Storage

This server uses MongoDB for data storage with automatic fallback to local JSON files if MongoDB is unavailable or disabled.

## Setup Instructions

### 1. Install Dependencies

Navigate to the server directory and install the required packages:

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the server directory (or copy from `.env.example`):

```env
# MongoDB Configuration
MONGO_ENABLED=true
MONGODB_URI=mongodb+srv://Admin:Ninemillionby30@mydb.df6jv0x.mongodb.net/?appName=MyDb
MONGODB_DB=connect-Ninemillionby30

# Server Configuration
PORT=3001
```

**Environment Variables:**

- `MONGO_ENABLED`: Set to `true`, `1`, `yes`, or `on` to enable MongoDB. Set to `false` to disable and use JSON storage.
- `MONGODB_URI`: Your MongoDB connection string
- `MONGODB_DB`: Database name to use
- `PORT`: Port for the server to listen on (default: 3001)

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## Features

### Dual Storage Mode

The server automatically detects MongoDB availability and falls back to local JSON storage if:
- MongoDB is disabled (`MONGO_ENABLED=false`)
- MongoDB connection fails
- Network issues prevent connection

When using JSON fallback:
- Data is stored in `server/data/entries.json` and `server/data/users.json`
- All API endpoints work identically
- Perfect for development or offline scenarios

### API Endpoints

**Authentication:**
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login with username/password

**Chat Entries:**
- `GET /api/entries?username=<username>` - Get all entries for a user
- `POST /api/entries` - Create a new entry
- `PUT /api/entries/:id` - Update an entry
- `DELETE /api/entries/:id` - Delete an entry

### Data Schema

**Chat Entry:**
```javascript
{
  id: String,          // Client-side UUID
  username: String,    // Owner username
  title: String,       // Entry title
  content: String,     // Entry content (markdown)
  timestamp: Number,   // Unix timestamp in milliseconds
  createdAt: String    // ISO date string (MongoDB only)
}
```

**User:**
```javascript
{
  username: String,    // Unique username
  password: String,    // Plain text (add encryption in production!)
  createdAt: String    // ISO date string
}
```

## MongoDB Collections

- `chatEntries` - Stores all chat entries with indexes on `id` and `username`
- `users` - Stores user accounts with unique index on `username`

## Troubleshooting

### MongoDB Connection Issues

If you see warnings about MongoDB connection failures:
1. Check your internet connection
2. Verify the `MONGODB_URI` is correct
3. Ensure your IP is whitelisted in MongoDB Atlas
4. The server will automatically use JSON storage as fallback

### Port Already in Use

If port 3001 is already in use, change the `PORT` in your `.env` file.

### CORS Issues

The server allows all origins by default. For production, update the CORS configuration in `server.js`:

```javascript
app.use(cors({ 
  origin: 'https://yourdomain.com',
  credentials: true 
}));
```

## Security Notes

⚠️ **Important for Production:**

1. **Password Storage**: Currently passwords are stored in plain text. Implement bcrypt hashing before production use.
2. **Authentication**: Add JWT tokens or session management for secure authentication.
3. **Environment Variables**: Never commit `.env` file to version control.
4. **CORS**: Restrict origins to your actual frontend domain.
5. **Input Validation**: Add request validation middleware (e.g., express-validator).

## Logging

The server logs all requests and responses with timing information:
```
[REQ] GET /api/entries?username=john
[RES] GET /api/entries?username=john -> 200 (45ms)
```

## Data Migration

To migrate from JSON to MongoDB:
1. Start the server with MongoDB enabled
2. Import your JSON data through the API
3. Or manually import using MongoDB tools

To backup MongoDB to JSON:
1. Set `MONGO_ENABLED=false`
2. The server will create local JSON files
3. Use the export feature from the frontend
