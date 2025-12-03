# Database Setup Instructions

## Quick Fix for "Could not find the table 'public.users'" Error

### Step 1: Create Tables in Supabase

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Schema**
   - Open the file `supabase_schema_simple.sql` in this folder
   - Copy ALL the SQL code
   - Paste it into the Supabase SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `users`
     - `crop_recommendations`
     - `disease_diagnoses`
     - `voice_queries`
     - `market_prices`

### Step 2: Configure Environment Variables

1. **Create `.env` file in the `backend` folder**
   ```bash
   cd backend
   copy .env.example .env
   ```

2. **Get your Supabase credentials:**
   - Go to Supabase Dashboard > Settings > API
   - Copy:
     - **Project URL** → `SUPABASE_URL`
     - **anon public key** → `SUPABASE_KEY`
     - **service_role key** → `SUPABASE_SERVICE_KEY` (optional, but recommended)

3. **Update `.env` file:**
   ```
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   JWT_SECRET_KEY=your-long-random-secret-key-here
   CORS_ORIGINS=http://localhost:3000
   ```

### Step 3: Restart Backend Server

After creating the tables and setting up `.env`, restart your backend server.

The registration should now work!

## Troubleshooting

### If you still get errors:

1. **Check Supabase connection:**
   - Verify your `.env` file has correct credentials
   - Make sure there are no extra spaces or quotes

2. **Check table names:**
   - In Supabase Table Editor, verify tables are named exactly:
     - `users` (not `user` or `Users`)
     - All lowercase, plural form

3. **Check RLS:**
   - The simplified schema disables RLS
   - If you used the original schema, you may need to disable RLS manually:
     ```sql
     ALTER TABLE users DISABLE ROW LEVEL SECURITY;
     ALTER TABLE crop_recommendations DISABLE ROW LEVEL SECURITY;
     ALTER TABLE disease_diagnoses DISABLE ROW LEVEL SECURITY;
     ALTER TABLE voice_queries DISABLE ROW LEVEL SECURITY;
     ```

