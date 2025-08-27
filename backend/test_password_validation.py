#!/usr/bin/env python3
"""
Test script for password validation functionality
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.auth import validate_password_complexity

def test_password_validation():
    """Test the password validation rules"""
    print("Testing password validation rules...")
    print("=" * 50)
    
    test_cases = [
        ("short", False, "Password less than 8 chars"),
        ("longenough", False, "No uppercase letter"),
        ("LONGENOUGH", False, "No lowercase letter"),
        ("LongEnough", False, "No number"),
        ("LongEnough1", True, "Valid: meets all requirements"),
        ("MyP@ssw0rd", True, "Valid: with special character"),
        ("Password123", True, "Valid: standard format"),
        ("aB3defgh", True, "Valid: minimum requirements"),
        ("12345678", False, "Only numbers"),
        ("abcdefgh", False, "Only lowercase"),
        ("ABCDEFGH", False, "Only uppercase"),
        ("Abcdefgh", False, "No number"),
    ]
    
    passed = 0
    failed = 0
    
    for password, expected, description in test_cases:
        is_valid, message = validate_password_complexity(password)
        status = "✓" if is_valid == expected else "✗"
        
        if is_valid == expected:
            passed += 1
        else:
            failed += 1
            
        print(f"{status} {description:30} | Password: '{password:15}' | Result: {message}")
    
    print("=" * 50)
    print(f"Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("✅ All validation tests passed!")
    else:
        print("❌ Some tests failed")
        sys.exit(1)

if __name__ == "__main__":
    print("\nPassword Validation Test")
    print("Requirements:")
    print("- Minimum 8 characters")
    print("- At least one uppercase letter")
    print("- At least one lowercase letter") 
    print("- At least one number")
    print()
    
    test_password_validation()