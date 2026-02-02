# FarmVoice AI Agent - Setup Instructions

## Database Setup (IMPORTANT - Run This First)

The agent needs new database tables. Follow these steps:

### 1. Open Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**

### 2. Run the Agent Schema Migration

1. Copy the contents of `backend/agent_schema.sql`
2. Paste into the SQL Editor
3. Click **Run** to create the tables

### 3. Verify Tables Created

Run this query to check:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'agent%';
```

You should see:

- `agent_sessions`
- `agent_actions`
- `agent_memory`

---

## Backend Restart

After running the migration, restart your backend server:

```powershell
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
cd backend
python main.py
```

---

## Testing the Agent

Once the backend is restarted, test the agent API:

### Health Check

```bash
curl http://localhost:8000/api/agent/health
```

Expected response:

```json
{
  "status": "healthy",
  "agent": "FarmVoice",
  "version": "1.0.0"
}
```

---

## Next Steps

1. ✅ Run database migration
2. ✅ Restart backend
3. 🔄 Frontend implementation (in progress)
4. 🔄 Integration testing
