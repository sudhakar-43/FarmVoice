import sys
import os
import json
import traceback

# Global try-except to catch initialization errors (imports, env vars, etc.)
try:
    from mangum import Mangum

    # Adjust Python path to include backend
    # On Netlify Lambda, task root is /var/task
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Assuming file is in /var/task/netlify/functions/api.py
    # Root would be /var/task
    root_dir = os.path.abspath(os.path.join(current_dir, '../../'))
    backend_path = os.path.join(root_dir, 'backend')
    
    # Add both paths to be safe
    sys.path.insert(0, root_dir)
    sys.path.insert(0, backend_path)

    # Attempt to import the FastAPI app
    from main import app

    handler = Mangum(app)

except Exception as e:
    # Capture the full traceback
    error_trace = traceback.format_exc()
    
    # Define a fallback handler that returns the error details
    def handler(event, context):
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "status": "error",
                "message": "Function initialization failed",
                "error_type": str(type(e).__name__),
                "error_details": str(e),
                "traceback": error_trace,
                "debug_info": {
                    "current_dir": current_dir,
                    "root_dir": root_dir,
                    "backend_path": backend_path,
                    "sys_path": sys.path,
                    "env_vars": [k for k in os.environ.keys()] 
                }
            })
        }
