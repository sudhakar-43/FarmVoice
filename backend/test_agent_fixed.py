"""
Comprehensive test script for FarmVoice Agent with Ollama
Tests all major functionality: crops, disease, weather, market, and general queries
"""

import asyncio
import logging
import json
from datetime import datetime
import sys
import os

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from voice_service.agent_core import farmvoice_agent


# Test queries covering all scenarios
TEST_QUERIES = [
    # Greetings
    {
        "query": "Hello, how are you?",
        "user_id": "test_user_1",
        "description": "Greeting test",
        "expected_intent": "greeting",
        "context": {},
    },
    # Crop Recommendations (with location)
    {
        "query": "What crops should I grow in my area?",
        "user_id": "test_user_2",
        "description": "Crop recommendation without location (should ask for it)",
        "expected_intent": "crop_recommendation",
        "context": {},
    },
    {
        "query": "Recommend crops for Karnataka",
        "user_id": "test_user_3",
        "description": "Crop recommendation for specific location",
        "expected_intent": "crop_recommendation",
        "context": {"location": "Karnataka"},
    },
    # Disease Diagnosis
    {
        "query": "My tomato plants have brown spots on leaves. What disease is this?",
        "user_id": "test_user_4",
        "description": "Disease diagnosis with symptoms",
        "expected_intent": "disease",
        "context": {"crop": "tomato"},
    },
    # Weather Queries
    {
        "query": "What is the weather like today?",
        "user_id": "test_user_5",
        "description": "Weather query without location",
        "expected_intent": "weather_check",
        "context": {},
    },
    # Market Prices
    {
        "query": "What are the current prices for rice in my area?",
        "user_id": "test_user_6",
        "description": "Market price query",
        "expected_intent": "market_prices",
        "context": {},
    },
    # General farming questions
    {
        "query": "How often should I water my rice crop?",
        "user_id": "test_user_7",
        "description": "General farming advice",
        "expected_intent": "general_chat",
        "context": {"crop": "rice"},
    },
    # Complex query
    {
        "query": "I'm in Maharashtra and want to grow sugarcane. Is it suitable? What about pests?",
        "user_id": "test_user_8",
        "description": "Complex multi-part question",
        "expected_intent": "crop_recommendation",
        "context": {"location": "Maharashtra"},
    },
]


async def test_agent():
    """Run all test queries against the agent"""

    logger.info("=" * 80)
    logger.info("FarmVoice Agent - Comprehensive Test Suite")
    logger.info("=" * 80)

    results = {"total": len(TEST_QUERIES), "passed": 0, "failed": 0, "tests": []}

    for i, test in enumerate(TEST_QUERIES, 1):
        logger.info(f"\n{'=' * 80}")
        logger.info(f"TEST {i}/{len(TEST_QUERIES)}: {test['description']}")
        logger.info(f"{'=' * 80}")
        logger.info(f"Query: {test['query']}")
        logger.info(f"User ID: {test['user_id']}")
        logger.info(f"Context: {test['context']}")

        try:
            # Call agent
            response = await farmvoice_agent.process_message(
                message=test["query"],
                user_id=test["user_id"],
                context=test.get("context", {}),
            )

            # Log response
            logger.info("\n--- RESPONSE ---")
            logger.info(f"Success: {response.get('success', False)}")
            logger.info(f"Speech: {response.get('speech', '(empty)')}")
            logger.info(f"Intent: {response.get('intent', '(none)')}")

            if response.get("suggestions"):
                logger.info(
                    f"Suggestions: {len(response.get('suggestions', []))} suggestions"
                )

            if response.get("actions_taken"):
                logger.info(
                    f"Actions Taken: {len(response.get('actions_taken', []))} actions"
                )
                for action in response.get("actions_taken", []):
                    logger.info(
                        f"  - {action.get('action', {}).get('type')} {action.get('action', {}).get('entity')}"
                    )

            if response.get("error"):
                logger.error(f"Error: {response.get('error')}")

            # Validate response
            test_passed = True
            errors = []

            # Check if response is successful
            if not response.get("success"):
                test_passed = False
                errors.append(f"Response marked unsuccessful: {response.get('error')}")

            # Check if speech is not empty
            if not response.get("speech") or response.get("speech").strip() == "":
                test_passed = False
                errors.append("Speech response is empty")

            # Check if speech is not just echoing the query
            if (
                response.get("speech", "").lower().strip()
                == test["query"].lower().strip()
            ):
                test_passed = False
                errors.append(
                    "Agent is echoing the user query instead of providing a response"
                )

            # Check speech length (reasonable limits)
            speech_len = len(response.get("speech", ""))
            if speech_len > 500:
                test_passed = False
                errors.append(f"Speech response too long ({speech_len} chars)")

            # Check for hallucination indicators
            hallucination_phrases = [
                "i think",
                "i believe",
                "likely",
                "probably",
                "seems like",
                "based on",
                "the algorithm",
                "ai model",
                "machine learning",
                "according to my knowledge",
            ]

            speech_lower = response.get("speech", "").lower()
            for phrase in hallucination_phrases:
                if phrase in speech_lower:
                    test_passed = False
                    errors.append(f"Hallucination detected: '{phrase}' in response")
                    break

            # Log result
            if test_passed:
                logger.info("✅ TEST PASSED")
                results["passed"] += 1
            else:
                logger.warning("❌ TEST FAILED")
                results["failed"] += 1
                for error in errors:
                    logger.warning(f"  - {error}")

            results["tests"].append(
                {
                    "test_num": i,
                    "description": test["description"],
                    "query": test["query"],
                    "passed": test_passed,
                    "errors": errors,
                    "response": {
                        "success": response.get("success"),
                        "speech": response.get("speech"),
                        "intent": response.get("intent"),
                        "actions_count": len(response.get("actions_taken", [])),
                        "suggestions_count": len(response.get("suggestions", [])),
                    },
                }
            )

        except Exception as e:
            logger.error(f"❌ TEST FAILED WITH EXCEPTION: {e}", exc_info=True)
            results["tests"].append(
                {
                    "test_num": i,
                    "description": test["description"],
                    "query": test["query"],
                    "passed": False,
                    "error": str(e),
                    "errors": [str(e)],
                }
            )
            results["failed"] += 1

        # Add small delay between tests
        await asyncio.sleep(0.5)

    # Summary
    logger.info(f"\n\n{'=' * 80}")
    logger.info("TEST SUMMARY")
    logger.info(f"{'=' * 80}")
    logger.info(f"Total Tests: {results['total']}")
    logger.info(
        f"Passed: {results['passed']} ({results['passed'] * 100 // results['total']}%)"
    )
    logger.info(
        f"Failed: {results['failed']} ({results['failed'] * 100 // results['total']}%)"
    )

    # Save detailed results
    with open("backend/test_results.json", "w") as f:
        json.dump(results, f, indent=2)

    logger.info(f"\nDetailed results saved to: backend/test_results.json")

    return results["passed"] == results["total"]


if __name__ == "__main__":
    try:
        success = asyncio.run(test_agent())
        exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("\nTest interrupted by user")
        exit(1)
    except Exception as e:
        logger.error(f"Test suite failed: {e}", exc_info=True)
        exit(1)
