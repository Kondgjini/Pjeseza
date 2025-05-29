#!/usr/bin/env python3
import requests
import json
import time
import random
import string
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"\'')
            break

# Ensure the URL doesn't have quotes
BACKEND_URL = BACKEND_URL.strip('"\'')
API_URL = f"{BACKEND_URL}/api"

print(f"Testing backend API at: {API_URL}")

# Test results
test_results = {
    "total_tests": 0,
    "passed_tests": 0,
    "failed_tests": 0,
    "tests": []
}

def run_test(test_name, test_func):
    """Run a test and record the result"""
    test_results["total_tests"] += 1
    print(f"\n{'='*80}\nRunning test: {test_name}\n{'='*80}")
    
    start_time = time.time()
    try:
        result = test_func()
        success = result.get("success", False)
        if success:
            test_results["passed_tests"] += 1
            status = "PASSED"
        else:
            test_results["failed_tests"] += 1
            status = "FAILED"
    except Exception as e:
        test_results["failed_tests"] += 1
        status = "ERROR"
        result = {"error": str(e)}
    
    end_time = time.time()
    duration = end_time - start_time
    
    test_results["tests"].append({
        "name": test_name,
        "status": status,
        "duration": duration,
        "result": result
    })
    
    print(f"Test {status}: {test_name} ({duration:.2f}s)")
    if status != "PASSED":
        print(f"Result: {json.dumps(result, indent=2)}")
    
    return result

def generate_random_user():
    """Generate random user data for testing"""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return {
        "username": f"testuser_{random_str}",
        "email": f"test_{random_str}@example.com",
        "password": f"Password{random_str}123!",
        "language_preference": "en"
    }

# Global variables to store test data
test_data = {
    "user_token": None,
    "user_id": None,
    "admin_token": None,
    "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "clip_id": None
}

# Test 1: User Registration
def test_user_registration():
    user_data = generate_random_user()
    
    # Store user data for later tests
    test_data["user_data"] = user_data
    
    response = requests.post(f"{API_URL}/auth/register", json=user_data)
    
    if response.status_code == 200:
        data = response.json()
        test_data["user_token"] = data.get("access_token")
        test_data["user_id"] = data.get("user", {}).get("id")
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "User registered successfully",
            "user_id": test_data["user_id"]
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Failed to register user",
            "response": response.json() if response.text else None
        }

# Test 2: User Login
def test_user_login():
    if not test_data.get("user_data"):
        return {"success": False, "message": "No user data available for login test"}
    
    login_data = {
        "email": test_data["user_data"]["email"],
        "password": test_data["user_data"]["password"]
    }
    
    response = requests.post(f"{API_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        test_data["user_token"] = data.get("access_token")
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "User logged in successfully"
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Failed to login user",
            "response": response.json() if response.text else None
        }

# Test 3: Admin Login
def test_admin_login():
    admin_credentials = {
        "email": "admin@pjeseza.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{API_URL}/auth/login", json=admin_credentials)
    
    if response.status_code == 200:
        data = response.json()
        test_data["admin_token"] = data.get("access_token")
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Admin logged in successfully",
            "admin_role": data.get("user", {}).get("role") == "admin"
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Failed to login as admin",
            "response": response.json() if response.text else None
        }

# Test 4: Get Current User
def test_get_current_user():
    if not test_data.get("user_token"):
        return {"success": False, "message": "No user token available for get current user test"}
    
    headers = {"Authorization": f"Bearer {test_data['user_token']}"}
    response = requests.get(f"{API_URL}/auth/me", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Got current user successfully",
            "user_id_match": data.get("id") == test_data["user_id"]
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Failed to get current user",
            "response": response.json() if response.text else None
        }

# Test 5: YouTube Video Info
def test_youtube_video_info():
    if not test_data.get("user_token"):
        return {"success": False, "message": "No user token available for YouTube info test"}
    
    headers = {"Authorization": f"Bearer {test_data['user_token']}"}
    video_data = {"url": test_data["youtube_url"]}
    
    response = requests.post(f"{API_URL}/video/info", json=video_data, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        test_data["video_id"] = data.get("video_id")
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Got YouTube video info successfully",
            "video_info": data.get("video_info")
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Failed to get YouTube video info",
            "response": response.json() if response.text else None
        }

# Test 6: Create Video Clip
def test_create_video_clip():
    if not test_data.get("user_token"):
        return {"success": False, "message": "No user token available for create clip test"}
    
    headers = {"Authorization": f"Bearer {test_data['user_token']}"}
    clip_data = {
        "youtube_url": test_data["youtube_url"],
        "start_time": 30,
        "end_time": 40,
        "clip_name": f"Test Clip {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    }
    
    response = requests.post(f"{API_URL}/video/clip", json=clip_data, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        test_data["clip_id"] = data.get("clip_id")
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Created video clip successfully",
            "clip_id": test_data["clip_id"]
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Failed to create video clip",
            "response": response.json() if response.text else None
        }

# Test 7: Get User Clips
def test_get_user_clips():
    if not test_data.get("user_token"):
        return {"success": False, "message": "No user token available for get clips test"}
    
    headers = {"Authorization": f"Bearer {test_data['user_token']}"}
    response = requests.get(f"{API_URL}/video/clips", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        clips = data.get("clips", [])
        clip_found = any(clip.get("id") == test_data.get("clip_id") for clip in clips) if test_data.get("clip_id") else False
        
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Got user clips successfully",
            "clips_count": len(clips),
            "created_clip_found": clip_found
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Failed to get user clips",
            "response": response.json() if response.text else None
        }

# Test 8: Admin - Get All Users
def test_admin_get_users():
    if not test_data.get("admin_token"):
        return {"success": False, "message": "No admin token available for get users test"}
    
    headers = {"Authorization": f"Bearer {test_data['admin_token']}"}
    response = requests.get(f"{API_URL}/admin/users", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        users = data.get("users", [])
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Got all users successfully",
            "users_count": len(users)
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Failed to get all users",
            "response": response.json() if response.text else None
        }

# Test 9: Admin - Get Platform Stats
def test_admin_get_stats():
    if not test_data.get("admin_token"):
        return {"success": False, "message": "No admin token available for get stats test"}
    
    headers = {"Authorization": f"Bearer {test_data['admin_token']}"}
    response = requests.get(f"{API_URL}/admin/stats", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Got platform stats successfully",
            "stats": data
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Failed to get platform stats",
            "response": response.json() if response.text else None
        }

# Test 10: AI - Auto Caption
def test_ai_auto_caption():
    if not test_data.get("user_token"):
        return {"success": False, "message": "No user token available for auto caption test"}
    
    headers = {"Authorization": f"Bearer {test_data['user_token']}"}
    video_data = {"video_id": test_data.get("video_id", "dummy_id")}
    
    response = requests.post(f"{API_URL}/ai/auto-caption", json=video_data, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Got auto captions successfully",
            "captions_count": len(data.get("captions", []))
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Failed to get auto captions",
            "response": response.json() if response.text else None
        }

# Test 11: AI - Generate Script
def test_ai_generate_script():
    if not test_data.get("user_token"):
        return {"success": False, "message": "No user token available for generate script test"}
    
    headers = {"Authorization": f"Bearer {test_data['user_token']}"}
    prompt_data = {
        "topic": "How to edit videos efficiently",
        "language": "en"
    }
    
    response = requests.post(f"{API_URL}/ai/generate-script", json=prompt_data, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Generated script successfully",
            "script_length": len(data.get("script", ""))
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Failed to generate script",
            "response": response.json() if response.text else None
        }

# Test 12: Security - Invalid Token
def test_security_invalid_token():
    headers = {"Authorization": "Bearer invalid_token"}
    response = requests.get(f"{API_URL}/auth/me", headers=headers)
    
    if response.status_code == 401:
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Security check passed - invalid token rejected"
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Security check failed - invalid token not rejected",
            "response": response.json() if response.text else None
        }

# Test 13: Security - Admin Access Control
def test_security_admin_access():
    if not test_data.get("user_token"):
        return {"success": False, "message": "No user token available for admin access test"}
    
    # Try to access admin endpoint with regular user token
    headers = {"Authorization": f"Bearer {test_data['user_token']}"}
    response = requests.get(f"{API_URL}/admin/users", headers=headers)
    
    if response.status_code == 403:
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Security check passed - regular user cannot access admin endpoints"
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Security check failed - regular user can access admin endpoints",
            "response": response.json() if response.text else None
        }

# Test 14: Error Handling - Invalid YouTube URL
def test_error_invalid_youtube_url():
    if not test_data.get("user_token"):
        return {"success": False, "message": "No user token available for invalid URL test"}
    
    headers = {"Authorization": f"Bearer {test_data['user_token']}"}
    video_data = {"url": "https://example.com/not-youtube"}
    
    response = requests.post(f"{API_URL}/video/info", json=video_data, headers=headers)
    
    if response.status_code == 400:
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Error handling check passed - invalid YouTube URL rejected"
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Error handling check failed - invalid YouTube URL not rejected",
            "response": response.json() if response.text else None
        }

# Test 15: Error Handling - Invalid Clip Times
def test_error_invalid_clip_times():
    if not test_data.get("user_token"):
        return {"success": False, "message": "No user token available for invalid clip times test"}
    
    headers = {"Authorization": f"Bearer {test_data['user_token']}"}
    clip_data = {
        "youtube_url": test_data["youtube_url"],
        "start_time": 50,
        "end_time": 40,  # End time before start time
        "clip_name": "Invalid Clip"
    }
    
    response = requests.post(f"{API_URL}/video/clip", json=clip_data, headers=headers)
    
    if response.status_code == 400:
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Error handling check passed - invalid clip times rejected"
        }
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "message": "Error handling check failed - invalid clip times not rejected",
            "response": response.json() if response.text else None
        }

# Run all tests
def run_all_tests():
    # Authentication tests
    run_test("User Registration", test_user_registration)
    run_test("User Login", test_user_login)
    run_test("Admin Login", test_admin_login)
    run_test("Get Current User", test_get_current_user)
    
    # YouTube integration tests
    run_test("YouTube Video Info", test_youtube_video_info)
    run_test("Create Video Clip", test_create_video_clip)
    run_test("Get User Clips", test_get_user_clips)
    
    # Admin feature tests
    run_test("Admin - Get All Users", test_admin_get_users)
    run_test("Admin - Get Platform Stats", test_admin_get_stats)
    
    # AI feature tests
    run_test("AI - Auto Caption", test_ai_auto_caption)
    run_test("AI - Generate Script", test_ai_generate_script)
    
    # Security tests
    run_test("Security - Invalid Token", test_security_invalid_token)
    run_test("Security - Admin Access Control", test_security_admin_access)
    
    # Error handling tests
    run_test("Error Handling - Invalid YouTube URL", test_error_invalid_youtube_url)
    run_test("Error Handling - Invalid Clip Times", test_error_invalid_clip_times)
    
    # Print summary
    print("\n" + "="*80)
    print(f"TEST SUMMARY: {test_results['passed_tests']}/{test_results['total_tests']} tests passed")
    print("="*80)
    
    for test in test_results["tests"]:
        status_symbol = "✅" if test["status"] == "PASSED" else "❌"
        print(f"{status_symbol} {test['name']}")
    
    print("="*80)
    
    # Return overall success
    return test_results["passed_tests"] == test_results["total_tests"]

if __name__ == "__main__":
    run_all_tests()
