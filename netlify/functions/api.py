import sys
import os
from mangum import Mangum

# Add backend directory to Python path
# This ensures that imports inside main.py (like 'from routers import...') work correctly
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend'))
sys.path.insert(0, backend_path)

from main import app

handler = Mangum(app)
