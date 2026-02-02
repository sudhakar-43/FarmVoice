
import os
import csv
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env variables
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

supabase: Client = create_client(url, key)

CSV_PATH = os.path.join(os.path.dirname(__file__), 'data', 'diseases.csv')

def seed_diseases():
    print(f"Reading from {CSV_PATH}...")
    
    rows_to_insert = []
    
    try:
        with open(CSV_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows_to_insert.append({
                    "crop_name": row["crop"],
                    "disease_name": row["name"],
                    "symptoms": row["symptoms"],
                    "control_methods": row["control"],
                    "description": row["description"],
                    "image_url": row["image_url"]
                })
    except FileNotFoundError:
        print(f"File not found: {CSV_PATH}")
        return

    if not rows_to_insert:
        print("No data to insert.")
        return

    print(f"Found {len(rows_to_insert)} records. Inserting into Supabase...")

    # Batch insert to avoid limits
    BATCH_SIZE = 50
    for i in range(0, len(rows_to_insert), BATCH_SIZE):
        batch = rows_to_insert[i:i+BATCH_SIZE]
        try:
            response = supabase.table("diseases").insert(batch).execute()
            print(f"Inserted batch {i//BATCH_SIZE + 1} ({len(batch)} records)")
        except Exception as e:
            print(f"Error inserting batch {i}: {e}")

    print("Seeding complete!")

if __name__ == "__main__":
    seed_diseases()
