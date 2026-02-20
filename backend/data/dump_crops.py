import json
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from crop_recommender import CROP_DATABASE

output_path = os.path.join(os.path.dirname(__file__), 'crops.json')

with open(output_path, 'w') as f:
    json.dump(CROP_DATABASE, f, indent=4)

print(f"Dumped {len(CROP_DATABASE)} crops to {output_path}")
