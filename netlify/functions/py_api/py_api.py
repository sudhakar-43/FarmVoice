import json
import os
import sys

def handler(event, context):
    try:
        # Debug info
        debug_info = {
            "message": "Hello from py_api",
            "sys_path": sys.path,
            "cwd": os.getcwd(),
            "env_vars_keys": list(os.environ.keys())
        }
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(debug_info)
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
