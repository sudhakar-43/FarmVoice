import sys
import os
import json
import traceback

# Global try-except to catch initialization errors (imports, env vars, etc.)
try:
    # Adjust Python path to include backend and the new Lib folder
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Assuming file is in /var/task/netlify/functions/api.py (or similar root)
    # Root would be /var/task
    root_dir = os.path.abspath(os.path.join(current_dir, '../../'))
    backend_path = os.path.join(root_dir, 'backend')
    lib_path = os.path.join(backend_path, 'lib')
    
    # Add paths to sys.path
    if lib_path not in sys.path:
        sys.path.insert(0, lib_path)
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)

    from mangum import Mangum
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
                    "lib_path": lib_path,
                    "sys_path": sys.path,
                    "env_vars": [k for k in os.environ.keys()] 
                }
            })
        }
