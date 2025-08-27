#!/usr/bin/env python3
"""
Test script for language detection feature
"""
import asyncio
import os
import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.converter import transcribe_and_convert
from app.config import settings

async def test_language_detection():
    """Test language detection with a sample audio file"""
    
    # Check if API key is configured
    if not settings.DEEPGRAM_API_KEY:
        print("Error: DEEPGRAM_API_KEY not configured in environment")
        return
    
    # You'll need to provide a test audio file
    test_audio = input("Enter path to test audio file: ").strip()
    if not os.path.exists(test_audio):
        print(f"Error: File {test_audio} does not exist")
        return
    
    # Create temporary output directory
    output_dir = Path("test_output")
    output_dir.mkdir(exist_ok=True)
    
    print("\nTesting language auto-detection...")
    print("-" * 40)
    
    try:
        # Test with auto-detection (language=None)
        result = await transcribe_and_convert(
            audio_path=test_audio,
            output_base_path=str(output_dir / "test_auto"),
            display_name="Test Auto-Detection",
            language=None,  # This should trigger detect_language=true
            model="nova-3"
        )
        
        print(f"✓ Transcription completed successfully")
        print(f"  Detected language: {result.get('language', 'Unknown')}")
        print(f"  Duration: {result.get('duration', 0):.2f} seconds")
        
        # Check if transcript was generated
        txt_path = result.get('txt_path')
        if txt_path and os.path.exists(txt_path):
            with open(txt_path, 'r') as f:
                content = f.read()
                if content.strip():
                    print(f"  Transcript preview: {content[:200]}...")
                else:
                    print("  WARNING: Transcript is empty!")
        
        # Check JSON for detected_language field
        json_path = result.get('json_path')
        if json_path and os.path.exists(json_path):
            with open(json_path, 'r') as f:
                json_data = json.load(f)
                channels = json_data.get('results', {}).get('channels', [])
                if channels:
                    detected = channels[0].get('detected_language')
                    confidence = channels[0].get('language_confidence')
                    print(f"  JSON detected_language: {detected}")
                    if confidence is not None:
                        print(f"  Language confidence: {confidence:.2f}")
        
        print("\n✓ Language detection test passed!")
        
    except Exception as e:
        print(f"✗ Error during transcription: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up test files
        cleanup = input("\nClean up test files? (y/n): ").strip().lower()
        if cleanup == 'y':
            for file in output_dir.glob("test_auto.*"):
                file.unlink()
            print("Test files cleaned up.")

if __name__ == "__main__":
    asyncio.run(test_language_detection())