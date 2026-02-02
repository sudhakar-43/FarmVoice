import requests
import os
import sys

# URL for the IN.csv file from sanand0/pincode repository
# This dataset is widely used and contains Pincode, District, State, Latitude, Longitude
DATA_URL = "https://raw.githubusercontent.com/sanand0/pincode/master/data/IN.csv"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "pincodes.csv")

def download_data():
    print(f"Downloading pincode data from {DATA_URL}...")
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")

    try:
        response = requests.get(DATA_URL, stream=True)
        response.raise_for_status()
        
        with open(OUTPUT_FILE, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                
        print(f"Successfully downloaded data to {OUTPUT_FILE}")
        
        # Verify line count
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            count = sum(1 for _ in f)
        print(f"Total pincodes: {count - 1}") # Subtract header
        
    except Exception as e:
        print(f"Error downloading data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    download_data()
