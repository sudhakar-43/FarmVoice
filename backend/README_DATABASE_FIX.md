# Database Fix Instructions

## Quick Fix for Database Errors

If you're seeing these errors:
- `Could not find the table 'public.selected_crops' in the schema cache`
- `Could not find the 'pincode' column of 'crop_recommendations' in the schema cache`

### Solution:

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Migration Script**
   - Copy and paste the contents of `backend/fix_database_errors.sql`
   - Click **Run** to execute

3. **Refresh Schema Cache**
   - Go to **Settings** > **API** in Supabase Dashboard
   - Click **"Reload Schema"** button (if available)
   - OR restart your Supabase project
   - OR wait 2-3 minutes for automatic refresh

4. **Restart Backend**
   - Stop your Python backend (Ctrl+C)
   - Start it again: `python main.py`

### Alternative: Run Complete Schema

If the quick fix doesn't work, run the complete schema:

1. Open Supabase SQL Editor
2. Copy and paste contents of `backend/supabase_schema.sql`
3. Run it (this will create all tables if they don't exist)
4. Refresh schema cache as above

### Verify Tables Exist

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check if selected_crops table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'selected_crops';

-- Check if pincode column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'crop_recommendations' 
AND column_name = 'pincode';

-- Check if location_data column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'crop_recommendations' 
AND column_name = 'location_data';
```

All queries should return at least one row if everything is set up correctly.

