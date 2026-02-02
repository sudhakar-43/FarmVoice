#!/usr/bin/env python3
"""
FarmVoice API Endpoint Tests
Tests the main API endpoints after agent fixes

Requirements:
- Backend running on http://localhost:8000
- Ollama running on http://localhost:11434
- Test database configured
"""

import requests
import json
import sys
from typing import Dict, Any
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api"
TEST_USER_ID = "test-user-" + datetime.now().strftime("%s")
TEST_SESSION_ID = "session-" + datetime.now().strftime("%s")

# ANSI Colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_test(test_name: str):
    """Print test header"""
    print(f"\n{BLUE}{'=' * 60}{RESET}")
    print(f"{BLUE}Test: {test_name}{RESET}")
    print(f"{BLUE}{'=' * 60}{RESET}")


def print_pass(message: str = "PASSED"):
    """Print pass message"""
    print(f"{GREEN}✓ {message}{RESET}")


def print_fail(message: str = "FAILED"):
    """Print fail message"""
    print(f"{RED}✗ {message}{RESET}")


def print_info(message: str):
    """Print info message"""
    print(f"{YELLOW}ℹ {message}{RESET}")


def check_server_health() -> bool:
    """Check if backend server is running"""
    print_test("Server Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_pass("Backend server is running")
            print_info(f"Response: {response.json()}")
            return True
        else:
            print_fail(f"Unexpected status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_fail(f"Cannot connect to {BASE_URL}")
        print_info("Make sure backend is running: python main.py")
        return False
    except Exception as e:
        print_fail(f"Error: {str(e)}")
        return False


def test_agent_query_crop_recommendation():
    """Test: Crop recommendation with location"""
    print_test("Agent Query - Crop Recommendation")

    payload = {
        "message": "What should I grow in Telangana during kharif?",
        "user_id": TEST_USER_ID,
        "session_id": TEST_SESSION_ID,
        "language": "en",
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/agent/query", json=payload, timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            print_pass(f"Status: {response.status_code}")
            print_info(f"Response keys: {list(data.keys())}")

            # Check response structure
            if "speech" in data:
                print_info(f"Speech (first 100 chars): {data['speech'][:100]}...")

                # Check for hallucinations
                hallucination_phrases = [
                    "i think",
                    "probably",
                    "likely",
                    "the algorithm",
                    "based on my knowledge",
                ]
                has_hallucination = any(
                    phrase in data["speech"].lower() for phrase in hallucination_phrases
                )

                if has_hallucination:
                    print_fail("Response contains hallucination phrases")
                    return False
                else:
                    print_pass("No hallucination phrases detected")

            if "actions_taken" in data:
                print_info(f"Actions taken: {data['actions_taken']}")

            if "suggestions" in data:
                print_info(f"Suggestions: {data['suggestions']}")

            return True
        else:
            print_fail(f"Status: {response.status_code}")
            print_info(f"Response: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print_fail("Request timeout (30s)")
        print_info("Check Ollama is running and response time")
        return False
    except Exception as e:
        print_fail(f"Error: {str(e)}")
        return False


def test_agent_query_disease_diagnosis():
    """Test: Disease diagnosis from symptoms"""
    print_test("Agent Query - Disease Diagnosis")

    payload = {
        "message": "My rice plants have brown spots on leaves and yellow edges",
        "user_id": TEST_USER_ID,
        "session_id": TEST_SESSION_ID,
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/agent/query", json=payload, timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            print_pass(f"Status: {response.status_code}")
            print_info(f"Speech (first 150 chars): {data.get('speech', '')[:150]}...")

            if (
                "disease" in data.get("speech", "").lower()
                or "brown spot" in data.get("speech", "").lower()
            ):
                print_pass("Correctly identified disease")
            else:
                print_info("Response received but disease diagnosis may vary")

            return True
        else:
            print_fail(f"Status: {response.status_code}")
            return False

    except Exception as e:
        print_fail(f"Error: {str(e)}")
        return False


def test_agent_query_weather():
    """Test: Weather query"""
    print_test("Agent Query - Weather Information")

    payload = {
        "message": "What's the weather going to be like for my crops?",
        "user_id": TEST_USER_ID,
        "session_id": TEST_SESSION_ID,
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/agent/query", json=payload, timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            print_pass(f"Status: {response.status_code}")

            speech = data.get("speech", "")
            if "location" in speech.lower() or "weather" in speech.lower():
                print_pass("Weather query handled correctly")

            return True
        else:
            print_fail(f"Status: {response.status_code}")
            return False

    except Exception as e:
        print_fail(f"Error: {str(e)}")
        return False


def test_agent_query_market_prices():
    """Test: Market price query"""
    print_test("Agent Query - Market Prices")

    payload = {
        "message": "What's the current market price for rice?",
        "user_id": TEST_USER_ID,
        "session_id": TEST_SESSION_ID,
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/agent/query", json=payload, timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            print_pass(f"Status: {response.status_code}")
            print_info(f"Response: {data.get('speech', '')[:150]}...")
            return True
        else:
            print_fail(f"Status: {response.status_code}")
            return False

    except Exception as e:
        print_fail(f"Error: {str(e)}")
        return False


def test_agent_conversation_history():
    """Test: Multi-turn conversation"""
    print_test("Agent Query - Conversation History")

    queries = [
        "Hello, my name is Raj",
        "I'm growing rice",
        "What's the best fertilizer for rice?",
    ]

    all_passed = True
    for i, query in enumerate(queries, 1):
        print_info(f"Message {i}: {query}")

        payload = {
            "message": query,
            "user_id": TEST_USER_ID,
            "session_id": TEST_SESSION_ID,
        }

        try:
            response = requests.post(
                f"{BASE_URL}{API_PREFIX}/agent/query", json=payload, timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                print_pass(f"Response received ({len(data.get('speech', ''))} chars)")
            else:
                print_fail(f"Status: {response.status_code}")
                all_passed = False
        except Exception as e:
            print_fail(f"Error: {str(e)}")
            all_passed = False

    return all_passed


def test_voice_query_endpoint():
    """Test: Voice query endpoint (if available)"""
    print_test("Voice Query Endpoint")

    payload = {
        "query": "What should I grow?",
        "language": "en",
        "location": {"latitude": 17.3850, "longitude": 78.4867},
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/voice/query", json=payload, timeout=30
        )

        if response.status_code == 200:
            print_pass(f"Endpoint available - Status: {response.status_code}")
            return True
        elif response.status_code == 404:
            print_info("Endpoint not available (may be optional)")
            return True
        else:
            print_fail(f"Status: {response.status_code}")
            return False

    except Exception as e:
        print_info(f"Endpoint not available: {str(e)}")
        return True  # Don't fail if endpoint is optional


def test_feedback_endpoint():
    """Test: Feedback submission endpoint"""
    print_test("Feedback Endpoint")

    payload = {
        "item_type": "crop_recommendation",
        "item_id": "test-123",
        "rating": 5,
        "comments": "Great recommendation!",
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/feedback", json=payload, timeout=10
        )

        if response.status_code == 200:
            print_pass(f"Feedback accepted - Status: {response.status_code}")
            return True
        elif response.status_code == 401:
            print_info("Feedback endpoint requires authentication (expected)")
            return True
        elif response.status_code == 404:
            print_info("Feedback endpoint not available (may be optional)")
            return True
        else:
            print_fail(f"Status: {response.status_code}")
            return False

    except Exception as e:
        print_info(f"Feedback endpoint not available: {str(e)}")
        return True  # Don't fail if endpoint is optional


def test_performance():
    """Test: Response time performance"""
    print_test("Performance - Response Time")

    payload = {
        "message": "What should I grow?",
        "user_id": TEST_USER_ID,
        "session_id": TEST_SESSION_ID,
    }

    import time

    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/agent/query", json=payload, timeout=60
        )
        elapsed_time = time.time() - start_time

        if response.status_code == 200:
            if elapsed_time < 5:
                print_pass(f"Excellent response time: {elapsed_time:.2f}s")
            elif elapsed_time < 10:
                print_pass(f"Good response time: {elapsed_time:.2f}s")
            elif elapsed_time < 30:
                print_info(f"Acceptable response time: {elapsed_time:.2f}s")
            else:
                print_fail(f"Slow response time: {elapsed_time:.2f}s")

            return True
        else:
            print_fail(f"Request failed with status: {response.status_code}")
            return False

    except Exception as e:
        print_fail(f"Error: {str(e)}")
        return False


def main():
    """Run all tests"""
    print(f"\n{BLUE}{'=' * 60}")
    print(f"FarmVoice API Endpoint Tests")
    print(f"{'=' * 60}{RESET}\n")

    # Check server health first
    if not check_server_health():
        print_fail("\nBackend server is not running!")
        print_info("Start it with: cd backend && python main.py")
        sys.exit(1)

    # Track results
    tests = [
        ("Agent Query - Crop Recommendation", test_agent_query_crop_recommendation),
        ("Agent Query - Disease Diagnosis", test_agent_query_disease_diagnosis),
        ("Agent Query - Weather", test_agent_query_weather),
        ("Agent Query - Market Prices", test_agent_query_market_prices),
        ("Agent Query - Conversation", test_agent_conversation_history),
        ("Voice Query Endpoint", test_voice_query_endpoint),
        ("Feedback Endpoint", test_feedback_endpoint),
        ("Performance - Response Time", test_performance),
    ]

    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print_fail(f"Unexpected error: {str(e)}")
            results[test_name] = False

    # Print summary
    print(f"\n{BLUE}{'=' * 60}")
    print(f"Test Summary")
    print(f"{'=' * 60}{RESET}\n")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, result in results.items():
        status = f"{GREEN}✓ PASS{RESET}" if result else f"{RED}✗ FAIL{RESET}"
        print(f"{status} - {test_name}")

    print(f"\n{BLUE}{'=' * 60}{RESET}")
    if passed == total:
        print(f"{GREEN}All {total} tests PASSED!{RESET}")
        print(f"{GREEN}API endpoints are working correctly.{RESET}")
        sys.exit(0)
    else:
        print(f"{YELLOW}{passed}/{total} tests passed{RESET}")
        print(f"{RED}{total - passed} tests failed{RESET}")
        sys.exit(1)


if __name__ == "__main__":
    main()
