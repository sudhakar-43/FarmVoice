import asyncio
import sys
import os

# Add project root and backend to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.voice_service.planner import voice_planner

async def test_real_llm_response():
    print("Testing 'Hi' to verify Real LLM usage (no mocks)...")
    
    # Mock context
    context = {"user_id": "test_user", "lat": 0.0, "lon": 0.0}
    
    # Process "Hi" - previously hardcoded
    result = await voice_planner.process_query("Hi", context)
    
    speech = result.get("speech", "")
    print(f"\nResponse: {speech}")
    
    # Verification logic:
    # 1. Should be successful
    # 2. Should NOT be one of the old hardcoded strings
    
    OLD_MOCKS = [
        "Hello! I'm FarmVoice, your farming assistant. How can I help you today?",
        "Namaste! I'm here to help with your farming needs. What would you like to know?",
        "Hi there! I can help you with weather, market prices, crop advice, and more."
    ]
    
    if speech in OLD_MOCKS:
        print("\nFAILURE: Response matches old mock data!")
        sys.exit(1)
        
    print("\nSUCCESS: Response seems dynamic/generated!")
    
    # Check timings to confirm it took some time (LLM latency)
    timings = result.get("timings", {})
    e2e = timings.get("e2e_ms", 0)
    print(f"Latency: {e2e:.0f}ms")
    
    if e2e < 50: # Mocks are usually sub-1ms or extremely fast
        print("WARNING: Response was suspiciously fast for an LLM.")

if __name__ == "__main__":
    asyncio.run(test_real_llm_response())
