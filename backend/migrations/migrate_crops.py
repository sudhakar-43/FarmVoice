import os
import sys
import json
from dotenv import load_dotenv

# Add backend to path to import crop_recommender
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

load_dotenv(override=True)

from supabase import create_client

# Supabase Configuration
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("Error: Supabase credentials not found.")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

def run_migration():
    print("Starting Crop Data Migration...")

    # 1. Create Table SQL
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS crops (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50),
        soil_preference JSONB,
        climate JSONB,
        temp_min DECIMAL(5,2),
        temp_max DECIMAL(5,2),
        rainfall_min DECIMAL(10,2),
        rainfall_max DECIMAL(10,2),
        seasons JSONB,
        growth_days_min INTEGER,
        growth_days_max INTEGER,
        water_requirement VARCHAR(50),
        ph_min DECIMAL(4,2),
        ph_max DECIMAL(4,2),
        states JSONB,
        description TEXT,
        image_url TEXT,
        scientific_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    # Execute Create Table (Using rpc if available or just assume it exists for now? 
    # The python client doesn't support raw SQL execution easily without an RPC function usually.
    # However, I can use the `postgres` connection string if I had it, but I only have the API URL/Key.
    # A workaround for 'create table' via client is hard. 
    # BUT, I saw `backend/supabase_schema.sql` earlier. I can try to append this table def to it 
    # or rely on the user to run SQL. 
    # WAIT! The prompt said "fix the project". I should probably assume I can run SQL or use a workaround.
    # If I can't run DDL, I'll fail. 
    # Actually, often `supabase.rpc('run_sql', {'query': ...})` is a pattern if a stored proc exists.
    # If not, I'll print the SQL and ask the user (or just try to insert and hope table exists?).
    # No, I should try to be autonomous.
    # The `backend/setup_venv.bat` implies a python env.
    
    # Let's try to assume the table might not exist.
    # I will SKIP table creation in python and assume I can't do DDL via the API client easily 
    # unless I have a specific RPC.
    # HOWEVER, I can modify `backend/supabase_schema.sql` and tell the user "I updated the schema".
    # BUT I want to solve it now.
    
    # I will TRY to insert. If it fails, I'll know.
    # Actually, I'll just focus on the INSERT part. I'll update the schema file first.
    pass

    # Import data locally to avoid side effects of full import
    from crop_recommender import CROP_DATABASE

    print(f"Found {len(CROP_DATABASE)} crops to migrate.")

    for name, data in CROP_DATABASE.items():
        # Transform data to match schema
        record = {
            "name": name,
            "category": data.get("category"),
            "soil_preference": data.get("soil_preference"), # JSONB
            "climate": data.get("climate"), # JSONB
            "temp_min": data.get("temp_range", [0, 0])[0],
            "temp_max": data.get("temp_range", [0, 0])[1],
            "rainfall_min": data.get("rainfall_mm", [0, 0])[0],
            "rainfall_max": data.get("rainfall_mm", [0, 0])[1],
            "seasons": data.get("seasons"), # JSONB
            "growth_days_min": data.get("growth_days", [0, 0])[0],
            "growth_days_max": data.get("growth_days", [0, 0])[1],
            "water_requirement": data.get("water_requirement"),
            "ph_min": data.get("ph_range", [0, 0])[0],
            "ph_max": data.get("ph_range", [0, 0])[1],
            "states": data.get("states"), # JSONB
            "description": f"A {data.get('category')} crop suitable for {', '.join(data.get('climate', []))} climates."
        }

        try:
            # Upsert (insert or update)
            # We use 'upsert' to avoid duplicates
            print(f"Migrating {name}...")
            supabase.table("crops").upsert(record, on_conflict="name").execute()
        except Exception as e:
            print(f"Failed to migrate {name}: {e}")
            # If table doesn't exist, this will fail.

if __name__ == "__main__":
    run_migration()
