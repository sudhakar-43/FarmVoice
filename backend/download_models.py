import os
import requests
from pathlib import Path
from faster_whisper import download_model

def download_file(url, dest_path):
    print(f"Downloading {url} to {dest_path}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    with open(dest_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print("Download complete.")

def main():
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    
    # 1. Download Faster Whisper Model
    print("\n=== Downloading Faster Whisper Model ===")
    whisper_dir = models_dir / "whisper"
    whisper_dir.mkdir(exist_ok=True)
    
    try:
        # This downloads to the cache dir by default, but we want it in our project
        # faster-whisper doesn't easily support custom download dir structure like we want
        # So we'll let it download to its default cache or specify a path
        # Actually, let's use the library function which returns the path
        print("Downloading 'large-v3' model...")
        model_path = download_model("large-v3", output_dir=str(whisper_dir))
        print(f"Whisper model downloaded to: {model_path}")
    except Exception as e:
        print(f"Error downloading whisper model: {e}")

    # 2. Download Piper TTS Voice
    print("\n=== Downloading Piper TTS Voice ===")
    piper_dir = models_dir / "piper"
    piper_dir.mkdir(exist_ok=True)
    
    voice_name = "en_US-lessac-medium"
    base_url = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium"
    
    onnx_url = f"{base_url}/{voice_name}.onnx"
    json_url = f"{base_url}/{voice_name}.onnx.json"
    
    onnx_path = piper_dir / f"{voice_name}.onnx"
    json_path = piper_dir / f"{voice_name}.onnx.json"
    
    try:
        if not onnx_path.exists():
            download_file(onnx_url, onnx_path)
        else:
            print(f"Voice model {voice_name}.onnx already exists.")
            
        if not json_path.exists():
            download_file(json_url, json_path)
        else:
            print(f"Voice config {voice_name}.onnx.json already exists.")
            
        print("Piper TTS voice downloaded.")
    except Exception as e:
        print(f"Error downloading piper voice: {e}")

if __name__ == "__main__":
    main()
