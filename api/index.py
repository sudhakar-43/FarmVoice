"""
Vercel Serverless Function Entry Point for FastAPI Backend
This wraps the FastAPI app from backend/main.py for Vercel deployment
"""
import sys
import os

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

# Import FastAPI app
from main import app

# Vercel expects a handler
handler = app
