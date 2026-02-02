import os
import json
import random
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Fallback to lib/supabaseClient.ts values if .env is missing
if not SUPABASE_URL:
    SUPABASE_URL = "https://ecdgvpxnlahxfbeevfqq.supabase.co"
if not SUPABASE_KEY:
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZGd2cHhubGFoeGZiZWV2ZnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzM0MTIsImV4cCI6MjA4MDAwOTQxMn0.8YmDk3VpywMezgNvJBIX8oBT5UgkKngCAemJMQi-d3A"

def get_crop_specific_guide(crop_name):
    name = crop_name.lower()
    
    # Hand-crafted guides for major crops
    if "rice" in name:
        return {
            "season": "Warm/Wet (Kharif)",
            "planting_steps": [
                "Select high-yield seeds suited for your soil type.",
                "Prepare nursery beds and sow seeds 3-4 weeks before transplanting.",
                "Puddle the main field twice and level it perfectly.",
                "Transplant 2-3 seedlings per hill at 2-3 cm depth.",
                "Maintain 5cm of standing water for the first week."
            ],
            "watering": "Requires standing water (5-10cm) during most growth stages. Drain the field only during top-dressing and 10 days before harvest.",
            "fertilizer": "Apply 120:60:60 kg NPK per hectare. Split Nitrogen into 3 doses: basal, tillering, and panicle initiation.",
            "harvesting": "Harvest when 80% of grains in the panicle turn golden yellow. Grains should have 20-25% moisture."
        }
    elif "tomato" in name:
        return {
            "season": "Year-round (Best in Subtropical/Temperate)",
            "planting_steps": [
                "Raise seedlings in pro-trays for 25-30 days.",
                "Apply generous amounts of well-rotted manure to the field.",
                "Transplant in the evening to avoid stress.",
                "Space plants 60cm apart in rows 75cm apart.",
                "Stake indeterminate varieties immediately after transplanting."
            ],
            "watering": "Consistent moisture is key. Avoid overhead watering to prevent leaf diseases. Use drip irrigation for best results.",
            "fertilizer": "High Potassium requirement. Apply NPK (15:15:15) as basal dose, followed by top-dressing during fruiting.",
            "harvesting": "Pick when the fruit shows a slight pink blush (breaker stage) for longer shelf life, or full red for immediate use."
        }
    elif "wheat" in name:
        return {
            "season": "Cool (Rabi)",
            "planting_steps": [
                "Prepare a fine seedbed by plowing 2-3 times.",
                "Sow during the first fortnight of November for optimal yield.",
                "Use a seed drill for uniform depth (4-5cm).",
                "Ensure row spacing of 22.5cm.",
                "Apply first irrigation at Crown Root Initiation (CRI) stage."
            ],
            "watering": "Requires 4-6 irrigations. Critical stages: CRI (21 days), tillering, flowering, and grain filling.",
            "fertilizer": "Standard dose: 120:60:40 kg NPK/ha. Full P and K at sowing, N in two splits.",
            "harvesting": "Harvest when the straw turns yellow and grains are hard. Typical moisture should be below 14%."
        }
    
    # Professional generic template for others
    is_warm = any(c in name for c in ["cotton", "maize", "corn", "mango", "banana", "watermelon", "millet"])
    return {
        "season": "Warm Season (Kharif)" if is_warm else "Cool Season (Rabi)",
        "planting_steps": [
            f"Select certified, disease-resistant {crop_name} seeds.",
            "Deep plow the land and incorporate 10-15 tons of FYM/ha.",
            "Sow seeds at the recommended depth (3-5 cm) for uniform germination.",
            "Maintain optimal plant-to-plant and row-to-row spacing.",
            "Monitor for early pests and ensure the soil is moist but not waterlogged."
        ],
        "watering": f"Watering requirements for {crop_name} vary by stage. Increase frequency during flowering and fruit setting. Avoid water stress during critical growth periods.",
        "fertilizer": f"Apply NPK based on soil test results. Generally, a balanced dose of 100:50:50 kg/ha is recommended for {crop_name}.",
        "harvesting": f"Harvest {crop_name} at physiological maturity. Sign centers around color changes and drying of leaves or pods. Store in a cool, dry place."
    }

def populate_data():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("--- Step 1: Fetching Crops ---")
    try:
        crops_res = supabase.table("crops").select("id, name").execute()
        crops = crops_res.data
        print(f"Found {len(crops)} crops.")
    except Exception as e:
        print(f"Error fetching crops: {e}")
        return

    print("--- Step 2: Populating Farming Guides ---")
    for crop in crops:
        crop_id = crop["id"]
        crop_name = crop["name"]
        
        guide_data = get_crop_specific_guide(crop_name)
        guide = {
            "crop_id": crop_id,
            **guide_data
        }
        
        try:
            # Upsert into farming_guides
            supabase.table("farming_guides").upsert(guide, on_conflict="crop_id").execute()
            print(f"  [✓] Guide for {crop_name}")
        except Exception as e:
            print(f"  [✗] Error guide for {crop_name}: {e}")

    print("--- Step 3: Updating Disease Severity ---")
    try:
        diseases_res = supabase.table("diseases").select("id, name").execute()
        diseases = diseases_res.data
        print(f"Found {len(diseases)} diseases.")
    except Exception as e:
        print(f"Error fetching diseases: {e}")
        diseases = []
    
    severities = ["High", "Medium", "Low"]
    for i, disease in enumerate(diseases):
        name = disease["name"].lower()
        if any(w in name for w in ["wilt", "blight", "rot", "deadly", "rust", "blast"]):
            severity = "High"
        elif any(w in name for w in ["spot", "mildew", "curl", "mosaic", "smut"]):
            severity = "Medium"
        else:
            severity = "Low"
            
        try:
            supabase.table("diseases").update({"severity": severity}).eq("id", disease["id"]).execute()
            if i % 100 == 0:
                print(f"  Updated {i} diseases...")
        except Exception as e:
            pass # Skip errors for severity column if it doesn't exist yet

    print("--- Finished ---")

if __name__ == "__main__":
    populate_data()
