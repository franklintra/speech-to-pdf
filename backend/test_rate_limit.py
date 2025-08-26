#!/usr/bin/env python3
"""
Test script for rate limiting on login endpoint.
This script will attempt multiple login requests to verify rate limiting is working.
"""

import requests
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"

# Test credentials (use invalid ones to test rate limiting)
test_credentials = {
    "username": "test_user",
    "password": "wrong_password"
}

def test_rate_limiting():
    """Test that rate limiting works on the login endpoint."""
    print("Testing Rate Limiting on Login Endpoint")
    print("=" * 50)
    print(f"Endpoint: {LOGIN_ENDPOINT}")
    print(f"Rate limit: 5 requests per minute per IP")
    print("=" * 50)
    
    successful_requests = 0
    rate_limited_requests = 0
    
    # Attempt 10 login requests
    for i in range(10):
        print(f"\nAttempt {i+1} at {datetime.now().strftime('%H:%M:%S')}")
        
        try:
            response = requests.post(
                LOGIN_ENDPOINT,
                data=test_credentials,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code == 401:
                print("  Response: Invalid credentials (expected for test)")
                successful_requests += 1
            elif response.status_code == 429:
                print("  Response: RATE LIMITED! Too many requests")
                rate_limited_requests += 1
                
                # Check for Retry-After header
                retry_after = response.headers.get('Retry-After')
                if retry_after:
                    print(f"  Retry-After: {retry_after} seconds")
                    
                # Print the response body if available
                try:
                    print(f"  Message: {response.json()}")
                except:
                    print(f"  Message: {response.text}")
            else:
                print(f"  Unexpected response: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"  Error making request: {e}")
            
        # Small delay between requests
        if i < 9:  # Don't sleep after the last request
            time.sleep(0.5)
    
    # Summary
    print("\n" + "=" * 50)
    print("Test Summary:")
    print(f"  Total attempts: 10")
    print(f"  Successful requests (401): {successful_requests}")
    print(f"  Rate limited requests (429): {rate_limited_requests}")
    
    if rate_limited_requests > 0:
        print("\n✅ Rate limiting is working correctly!")
        print("   The login endpoint blocked requests after 5 attempts per minute.")
    else:
        print("\n⚠️  Rate limiting may not be working.")
        print("   All requests went through without being rate limited.")
        print("   Make sure the backend server is running with the rate limiting changes.")
    
    # Test waiting for rate limit to reset
    if rate_limited_requests > 0:
        print("\n" + "=" * 50)
        print("Waiting 60 seconds for rate limit to reset...")
        time.sleep(60)
        
        print("\nTrying one more request after waiting:")
        response = requests.post(
            LOGIN_ENDPOINT,
            data=test_credentials,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 401:
            print("✅ Request successful after waiting - rate limit reset!")
        elif response.status_code == 429:
            print("❌ Still rate limited after 60 seconds")
        else:
            print(f"Unexpected response: {response.status_code}")

if __name__ == "__main__":
    print("\nRate Limit Testing Tool")
    print("Make sure your backend server is running on http://localhost:8000")
    print("Press Ctrl+C to stop at any time\n")
    
    try:
        test_rate_limiting()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\nError during testing: {e}")
        print("Make sure the backend server is running!")