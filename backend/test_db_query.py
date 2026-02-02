
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def test_disease_query(crop_name):
    print(f"Testing query for crop: {crop_name}")
    try:
        response = supabase.table("diseases").select("*").ilike("crop_name", f"%{crop_name}%").execute()
        if response.data:
            print(f"Success! Found {len(response.data)} diseases.")
            print(f"Sample: {response.data[0]['disease_name']}")
        else:
            print("No data found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_disease_query("Tomato")
    test_disease_query("Rice")
