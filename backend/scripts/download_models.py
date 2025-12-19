#!/usr/bin/env python3
"""
Model Download Script for FarmVoice Voice Assistant
Downloads required models for STT, TTS, and LLM services
"""

import os
import sys
import urllib.request
import hashlib
from pathlib import Path

# Model configurations
MODELS = {
    "faster-whisper": {
        "name": "Faster Whisper (Small)",
        "url": "https://huggingface.co/guillaumekln/faster-whisper-small",
        "path": "faster-whisper-small",
        "description": "Speech-to-Text model",
        "size": "~500MB",
        "required": True
    },
    "piper-tts": {
        "name": "Piper TTS (English)",
        "url": "https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/medium",
        "path": "piper-tts-en",
        "description": "Text-to-Speech model",
        "size": "~50MB",
        "required": True
    },
    "llama-cpp": {
        "name": "Llama.cpp Model (7B)",
        "url": "https://huggingface.co/TheBloke/Llama-2-7B-GGUF",
        "path": "llama-2-7b-gguf",
        "description": "Local LLM for query processing",
        "size": "~4GB",
        "required": False
    }
}

def get_models_dir():
    """Get the models directory path"""
    script_dir = Path(__file__).parent.parent
    models_dir = script_dir / "models"
    models_dir.mkdir(exist_ok=True)
    return models_dir

def check_disk_space(required_gb=10):
    """Check if there's enough disk space"""
    import shutil
    total, used, free = shutil.disk_usage("/")
    free_gb = free // (2**30)
    return free_gb >= required_gb

def download_with_progress(url, dest_path):
    """Download file with progress bar"""
    def reporthook(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size)
        sys.stdout.write(f"\\r{percent}% ")
        sys.stdout.flush()
    
    try:
        urllib.request.urlretrieve(url, dest_path, reporthook)
        print()  # New line after progress
        return True
    except Exception as e:
        print(f"\\nError downloading: {e}")
        return False

def install_model(model_id, config):
    """Install a specific model"""
    models_dir = get_models_dir()
    model_path = models_dir / config["path"]
    
    print(f"\\n{'='*60}")
    print(f"Model: {config['name']}")
    print(f"Description: {config['description']}")
    print(f"Size: {config['size']}")
    print(f"Required: {'Yes' if config['required'] else 'No (Optional)'}")
    print(f"{'='*60}")
    
    if model_path.exists():
        print(f"✓ Model already exists at {model_path}")
        response = input("Reinstall? (y/N): ").strip().lower()
        if response != 'y':
            return True
    
    print(f"\\nDownloading {config['name']}...")
    print(f"URL: {config['url']}")
    print("\\nNOTE: This is a placeholder script. For actual downloads:")
    print(f"  1. Visit: {config['url']}")
    print(f"  2. Download the model files")
    print(f"  3. Place them in: {model_path}")
    
    # Create model directory
    model_path.mkdir(exist_ok=True)
    
    # Create a marker file
    marker_file = model_path / "README.txt"
    with open(marker_file, "w") as f:
        f.write(f"{config['name']}\\n")
        f.write(f"Download from: {config['url']}\\n")
        f.write(f"Description: {config['description']}\\n")
    
    print(f"✓ Model directory created at {model_path}")
    return True

def main():
    """Main function"""
    print("="*60)
    print("FarmVoice Voice Assistant - Model Downloader")
    print("="*60)
    
    # Check disk space
    print("\\nChecking disk space...")
    if not check_disk_space(10):
        print("⚠️  Warning: Low disk space. At least 10GB recommended.")
        response = input("Continue anyway? (y/N): ").strip().lower()
        if response != 'y':
            return
    
    models_dir = get_models_dir()
    print(f"\\nModels directory: {models_dir}")
    
    # Show available models
    print("\\nAvailable models:")
    for i, (model_id, config) in enumerate(MODELS.items(), 1):
        required = "Required" if config['required'] else "Optional"
        print(f"  {i}. {config['name']} - {config['size']} ({required})")
    
    print("\\nOptions:")
    print("  a. Install all required models")
    print("  r. Install required models only")
    print("  [1-{}]. Install specific model".format(len(MODELS)))
    print("  q. Quit")
    
    choice = input("\\nYour choice: ").strip().lower()
    
    if choice == 'q':
        return
    elif choice == 'a':
        for model_id, config in MODELS.items():
            install_model(model_id, config)
    elif choice == 'r':
        for model_id, config in MODELS.items():
            if config['required']:
                install_model(model_id, config)
    elif choice.isdigit() and 1 <= int(choice) <= len(MODELS):
        model_id = list(MODELS.keys())[int(choice) - 1]
        install_model(model_id, MODELS[model_id])
    else:
        print("Invalid choice")
    
    print("\\n" + "="*60)
    print("Setup complete!")
    print("="*60)
    print("\\nNext steps:")
    print("1. Download the actual model files from the URLs mentioned")
    print("2. Update the .env.voice file with correct model paths")
    print("3. Run: python -m uvicorn main:app --reload")
    print("\\nFor detailed instructions, see docs/VOICE_ASSISTANT_RUNBOOK.md")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\\n\\nInterrupted by user")
        sys.exit(0)
